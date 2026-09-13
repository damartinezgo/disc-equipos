'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Check,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  Users,
  Pencil,
  Trash2,
  Upload,
  FileSpreadsheet,
  FileArchive,
  X,
  RefreshCw,
  FileUp,
  Info,
  Building2,
  Plus,
} from '@/lib/icons'
import GraficosDashboard from './graficos-dashboard'
import MapaCalor from './mapa-calor'
import { createDISCPdfDoc } from '@/components/disc/DISCPdfReport'
import { renderRadarChartBase64 } from '@/components/disc/DISCCharts'
import {
  calculateRawScores,
  calculateSubcategoryScores,
  determineStyleCombination,
  getReportFeedback,
  type UserResponses,
} from '@/lib/disc/discService'

const COLOR_ESTILO: Record<string, string> = {
  D: '#1F4E79',
  I: '#C00000',
  S: '#D9A300',
  C: '#00843D',
}
const DEPARTAMENTOS_COLOMBIA = [
  'AMAZONAS', 'ANTIOQUIA', 'ARAUCA', 'ATLÁNTICO', 'BOLÍVAR', 'BOYACÁ', 'CALDAS', 'CAQUETÁ',
  'CASANARE', 'CAUCA', 'CESAR', 'CHOCÓ', 'CÓRDOBA', 'CUNDINAMARCA', 'GUAINÍA', 'GUAVIARE',
  'HUILA', 'LA GUAJIRA', 'MAGDALENA', 'META', 'NARIÑO', 'NORTE DE SANTANDER', 'PUTUMAYO',
  'QUINDÍO', 'RISARALDA', 'SAN ANDRÉS Y PROVIDENCIA', 'SANTANDER', 'SUCRE', 'TOLIMA',
  'VALLE DEL CAUCA', 'VAUPÉS', 'VICHADA',
]

const NOMBRE_ESTILO: Record<string, string> = {
  D: 'Dominancia',
  I: 'Influencia',
  S: 'Estabilidad',
  C: 'Conciencia',
}

type Persona = {
  user_id: string
  completado: boolean
  porcentaje: number
  perfiles: {
    nombre: string
    primer_apellido?: string
    segundo_apellido?: string
    cedula?: string
    departamento?: string
    dependencia_funciones?: string
    telefono?: string
    created_at: string
    correo: string
  }[]
  respuestas_mas?: Record<string, string> | null
  respuestas_menos?: Record<string, string> | null
  // Scoring — null si aún no completó
  d_global: number | null
  i_global: number | null
  s_global: number | null
  c_global: number | null
  estilo_principal: string | null
  estilo_secundario: string | null
  perfil_combinado: string | null
  perfil_trabajo_d: number | null; perfil_trabajo_i: number | null
  perfil_trabajo_s: number | null; perfil_trabajo_c: number | null
  motivacion_d: number | null; motivacion_i: number | null
  motivacion_s: number | null; motivacion_c: number | null
  gestion_jefe_d: number | null; gestion_jefe_i: number | null
  gestion_jefe_s: number | null; gestion_jefe_c: number | null
  dinamica_equipo_d: number | null; dinamica_equipo_i: number | null
  dinamica_equipo_s: number | null; dinamica_equipo_c: number | null
}

type UsuarioRegistrado = {
  id: string
  nombre: string
  cedula: string
  primer_apellido: string
  segundo_apellido: string
  departamento: string
  municipio: string
  dependencia_funciones: string
  telefono: string
  correo: string
  created_at: string
}

const INITIAL_FORM = {
  correo: '',
  cedula: '',
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  departamento: '',
  municipio: '',
  dependencia_funciones: '',
  telefono: '',
}

export default function DashboardCliente({
  personas,
}: {
  personas: Persona[]
}) {
  const router = useRouter()
  const [listaPersonas, setListaPersonas] = useState<Persona[]>(personas)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListaPersonas(personas)
  }, [personas])

  // Tabs: 'graficos' | 'tabla' | 'usuarios'
  const [activeTab, setActiveTab] = useState<'graficos' | 'tabla' | 'usuarios'>('tabla')

  // --- Filtros Tab Resultados DISC ---
  const [filtroDepto, setFiltroDepto] = useState<string>('todos')
  const [filtroDependencia, setFiltroDependencia] = useState<string>('todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [exportando, setExportando] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const REGISTROS_POR_PAGINA = 10

  // --- Selección múltiple para descarga ZIP ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [descargandoZip, setDescargandoZip] = useState(false)
  const [zipProgreso, setZipProgreso] = useState<{ actual: number; total: number } | null>(null)

  // --- Gestión de Usuarios State ---
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<UsuarioRegistrado[]>([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [filtroDepartamentoUsuarios, setFiltroDepartamentoUsuarios] = useState('todos')
  const [filtroDependenciaUsuarios, setFiltroDependenciaUsuarios] = useState('todos')
  const [paginaUsuarios, setPaginaUsuarios] = useState(1)
  const [exportandoUsuarios, setExportandoUsuarios] = useState(false)
  const USUARIOS_POR_PAGINA = 10

  // Modales de Usuarios
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false)
  const [formDataCrear, setFormDataCrear] = useState(INITIAL_FORM)
  const [guardandoCrear, setGuardandoCrear] = useState(false)
  const [msgCrear, setMsgCrear] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioRegistrado | null>(null)
  const [formDataEditar, setFormDataEditar] = useState(INITIAL_FORM)
  const [guardandoEditar, setGuardandoEditar] = useState(false)
  const [msgEditar, setMsgEditar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const [usuarioEliminar, setUsuarioEliminar] = useState<UsuarioRegistrado | null>(null)
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false)
  const [msgEliminar, setMsgEliminar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  // Modal Carga Masiva
  const [mostrarModalCarga, setMostrarModalCarga] = useState(false)
  const [archivoCarga, setArchivoCarga] = useState<File | null>(null)
  const [cargandoArchivo, setCargandoArchivo] = useState(false)
  const [resultadoCarga, setResultadoCarga] = useState<{
    ok: boolean
    total?: number
    creados?: number
    actualizados?: number
    fallidos?: number
    errores?: string[]
    errorGeneral?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Catálogo maestro de dependencias (tabla `equipos`)
  const [catalogoDependencias, setCatalogoDependencias] = useState<string[]>([])

  const cargarCatalogoDependencias = useCallback(() => {
    fetch('/api/equipos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Array<{ nombre: string }>) => {
        setCatalogoDependencias(Array.from(new Set(data.map((e) => e.nombre))).sort())
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargarCatalogoDependencias()
  }, [cargarCatalogoDependencias])

  // --- GESTIÓN RÁPIDA DE DEPENDENCIA (desde los modales de usuario, botón "+") ---
  type DependenciaCatalogo = { id: number; nombre: string; departamento: string | null }
  // null = cerrado, 'crear' | 'editar' = a qué formulario de usuario debe volcarse la dependencia elegida/creada
  const [altaDependenciaPara, setAltaDependenciaPara] = useState<'crear' | 'editar' | null>(null)
  const [modoGestionDep, setModoGestionDep] = useState<'crear' | 'existente'>('crear')
  const [nuevaDepForm, setNuevaDepForm] = useState({ nombre: '', departamento: '' })
  const [guardandoNuevaDep, setGuardandoNuevaDep] = useState(false)
  const [eliminandoDepRapida, setEliminandoDepRapida] = useState(false)
  const [msgNuevaDep, setMsgNuevaDep] = useState<string | null>(null)

  const [catalogoCompletoDep, setCatalogoCompletoDep] = useState<DependenciaCatalogo[]>([])
  const [depSeleccionada, setDepSeleccionada] = useState<DependenciaCatalogo | null>(null)
  const [confirmarEliminarDep, setConfirmarEliminarDep] = useState(false)

  const abrirGestionDependencia = (para: 'crear' | 'editar') => {
    setAltaDependenciaPara(para)
    setModoGestionDep('crear')
    setNuevaDepForm({ nombre: '', departamento: '' })
    setDepSeleccionada(null)
    setConfirmarEliminarDep(false)
    setMsgNuevaDep(null)
    fetch('/api/admin/dependencias')
      .then((res) => (res.ok ? res.json() : { dependencias: [] }))
      .then((data) => setCatalogoCompletoDep(data.dependencias ?? []))
      .catch(() => {})
  }

  const seleccionarDependenciaExistente = (nombre: string) => {
    const dep = catalogoCompletoDep.find((d) => d.nombre === nombre) || null
    setDepSeleccionada(dep)
    setConfirmarEliminarDep(false)
    if (dep) setNuevaDepForm({ nombre: dep.nombre, departamento: dep.departamento || '' })
  }

  const aplicarDependenciaAlFormulario = (nombre: string, departamento: string) => {
    if (altaDependenciaPara === 'crear') {
      setFormDataCrear((f) => ({ ...f, dependencia_funciones: nombre, departamento: departamento || f.departamento }))
    } else if (altaDependenciaPara === 'editar') {
      setFormDataEditar((f) => ({ ...f, dependencia_funciones: nombre, departamento: departamento || f.departamento }))
    }
  }

  const handleCrearDependenciaRapida = async () => {
    setGuardandoNuevaDep(true)
    setMsgNuevaDep(null)
    try {
      const res = await fetch('/api/admin/dependencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaDepForm.nombre, departamento: nuevaDepForm.departamento }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsgNuevaDep(data.error || 'Error al crear la dependencia')
        return
      }
      cargarCatalogoDependencias()
      aplicarDependenciaAlFormulario(data.dependencia.nombre, nuevaDepForm.departamento)
      setNuevaDepForm({ nombre: '', departamento: '' })
      setAltaDependenciaPara(null)
    } catch {
      setMsgNuevaDep('Error de conexión')
    } finally {
      setGuardandoNuevaDep(false)
    }
  }

  const handleActualizarDependenciaRapida = async () => {
    if (!depSeleccionada) return
    setGuardandoNuevaDep(true)
    setMsgNuevaDep(null)
    try {
      const res = await fetch('/api/admin/dependencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: depSeleccionada.id, nombre: nuevaDepForm.nombre, departamento: nuevaDepForm.departamento }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsgNuevaDep(data.error || 'Error al actualizar la dependencia')
        return
      }
      cargarCatalogoDependencias()
      aplicarDependenciaAlFormulario(data.dependencia.nombre, nuevaDepForm.departamento)
      setAltaDependenciaPara(null)
    } catch {
      setMsgNuevaDep('Error de conexión')
    } finally {
      setGuardandoNuevaDep(false)
    }
  }

  const handleEliminarDependenciaRapida = async () => {
    if (!depSeleccionada) return
    setEliminandoDepRapida(true)
    setMsgNuevaDep(null)
    try {
      const res = await fetch(`/api/admin/dependencias?id=${depSeleccionada.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsgNuevaDep(data.error || 'Error al eliminar la dependencia')
        return
      }
      cargarCatalogoDependencias()
      setCatalogoCompletoDep((prev) => prev.filter((d) => d.id !== depSeleccionada.id))
      setDepSeleccionada(null)
      setNuevaDepForm({ nombre: '', departamento: '' })
      setConfirmarEliminarDep(false)
    } catch {
      setMsgNuevaDep('Error de conexión')
    } finally {
      setEliminandoDepRapida(false)
    }
  }

  // Carga inicial de usuarios
  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUsuariosRegistrados(data.usuarios ?? [])
      }
    } finally {
      setCargandoUsuarios(false)
    }
  }, [router])

  useEffect(() => {
    if (activeTab === 'usuarios' && usuariosRegistrados.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarUsuarios()
    }
  }, [activeTab, usuariosRegistrados.length, cargarUsuarios])

  // --- FILTROS TAB RESULTADOS DISC ---
  const departamentosUnicosMain = useMemo(
    () => Array.from(new Set(listaPersonas.map((p) => p.perfiles?.[0]?.departamento).filter(Boolean))).sort() as string[],
    [listaPersonas]
  )

  const dependenciasUnicasMain = useMemo(() => {
    const base = filtroDepto === 'todos'
      ? listaPersonas
      : listaPersonas.filter((p) => p.perfiles?.[0]?.departamento === filtroDepto)
    return Array.from(new Set(base.map((p) => p.perfiles?.[0]?.dependencia_funciones).filter(Boolean))).sort() as string[]
  }, [listaPersonas, filtroDepto])

  const filtradas = useMemo(() => {
    return listaPersonas.filter((p) => {
      const perf = p.perfiles?.[0]
      const depto = perf?.departamento ?? ''
      const dep = perf?.dependencia_funciones ?? ''
      const nombreCompleto = [perf?.nombre, perf?.primer_apellido, perf?.segundo_apellido].filter(Boolean).join(' ')

      if (filtroDepto !== 'todos' && depto !== filtroDepto) return false
      if (filtroDependencia !== 'todos' && dep !== filtroDependencia) return false
      if (filtroEstilo !== 'todos' && p.estilo_principal !== filtroEstilo) return false
      if (filtroEstado === 'completado' && !p.completado) return false
      if (filtroEstado === 'pendiente' && p.completado) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const match =
          nombreCompleto.toLowerCase().includes(q) ||
          dep.toLowerCase().includes(q) ||
          depto.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [listaPersonas, filtroDepto, filtroDependencia, filtroEstilo, filtroEstado, busqueda])

  const conScoring = filtradas.filter((p) => p.completado)
  const totalCompletados = listaPersonas.filter((p) => p.completado).length
  const pctCompletado = listaPersonas.length
    ? Math.round((totalCompletados / listaPersonas.length) * 100)
    : 0

  const totalPaginas = Math.ceil(filtradas.length / REGISTROS_POR_PAGINA)
  const paginadas = useMemo(() => {
    const start = (paginaActual - 1) * REGISTROS_POR_PAGINA
    return filtradas.slice(start, start + REGISTROS_POR_PAGINA)
  }, [filtradas, paginaActual])

  // --- FILTROS TAB GESTIÓN DE USUARIOS ---
  const departamentosUnicosUsuarios = useMemo(
    () => Array.from(new Set(usuariosRegistrados.map((u) => u.departamento).filter(Boolean))).sort(),
    [usuariosRegistrados]
  )
  const sugerenciasDepartamentos = useMemo(() => Array.from(new Set([
    ...DEPARTAMENTOS_COLOMBIA,
    ...departamentosUnicosMain,
    ...departamentosUnicosUsuarios,
  ])).sort(), [departamentosUnicosMain, departamentosUnicosUsuarios])

  const dependenciasUnicasUsuarios = useMemo(() => {
    const base = filtroDepartamentoUsuarios === 'todos'
      ? usuariosRegistrados
      : usuariosRegistrados.filter((u) => u.departamento === filtroDepartamentoUsuarios)
    return Array.from(new Set(base.map((u) => u.dependencia_funciones).filter(Boolean))).sort()
  }, [usuariosRegistrados, filtroDepartamentoUsuarios])

  const usuariosFiltrados = useMemo(() => {
    return usuariosRegistrados.filter((u) => {
      if (filtroDepartamentoUsuarios !== 'todos' && u.departamento !== filtroDepartamentoUsuarios) return false
      if (filtroDependenciaUsuarios !== 'todos' && u.dependencia_funciones !== filtroDependenciaUsuarios) return false
      if (busquedaUsuarios) {
        const q = busquedaUsuarios.toLowerCase()
        const match =
          u.nombre?.toLowerCase().includes(q) ||
          u.correo?.toLowerCase().includes(q) ||
          u.cedula?.toLowerCase().includes(q) ||
          u.primer_apellido?.toLowerCase().includes(q) ||
          u.segundo_apellido?.toLowerCase().includes(q) ||
          u.telefono?.toLowerCase().includes(q) ||
          u.departamento?.toLowerCase().includes(q) ||
          u.dependencia_funciones?.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [usuariosRegistrados, filtroDepartamentoUsuarios, filtroDependenciaUsuarios, busquedaUsuarios])

  const totalPaginasUsuarios = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA)
  const usuariosPaginados = useMemo(() => {
    const start = (paginaUsuarios - 1) * USUARIOS_POR_PAGINA
    return usuariosFiltrados.slice(start, start + USUARIOS_POR_PAGINA)
  }, [usuariosFiltrados, paginaUsuarios])

  // --- SELECCIÓN MÚLTIPLE ---
  const completadasFiltradas = useMemo(() => filtradas.filter((p) => p.completado), [filtradas])

  function toggleSelectAll() {
    if (selectedIds.size === completadasFiltradas.length && completadasFiltradas.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(completadasFiltradas.map((p) => p.user_id)))
    }
  }

  function toggleSelectOne(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  // --- DESCARGA MASIVA ZIP ---
  async function handleBulkDownload() {
    const seleccionadas = filtradas.filter((p) => selectedIds.has(p.user_id) && p.completado)
    if (seleccionadas.length === 0) return

    setDescargandoZip(true)
    setZipProgreso({ actual: 0, total: seleccionadas.length })

    try {
      // Importar JSZip dinámicamente para no aumentar el bundle inicial
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      for (let i = 0; i < seleccionadas.length; i++) {
        const p = seleccionadas[i]
        setZipProgreso({ actual: i + 1, total: seleccionadas.length })

        try {
          const perf = p.perfiles?.[0]
          const nombreCompleto = [perf?.nombre, perf?.primer_apellido, perf?.segundo_apellido]
            .filter(Boolean).join(' ') || 'evaluado'

          // Si no hay datos de respuestas en memoria, buscarlos en el batch endpoint
          let resMas = p.respuestas_mas
          let resMenos = p.respuestas_menos

          if (!resMas || !resMenos) {
            const batchRes = await fetch('/api/admin/respuestas-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [p.user_id] }),
            })
            if (batchRes.ok) {
              const batchData = await batchRes.json()
              const entry = (batchData.respuestas ?? [])[0]
              if (entry) {
                resMas = entry.respuestas_mas
                resMenos = entry.respuestas_menos
              }
            }
          }

          // Convertir respuestas_mas/menos al formato UserResponses (índice numérico)
          const userResponses: UserResponses = {}
          const mas_map = resMas ?? {}
          const menos_map = resMenos ?? {}
          for (let idx = 1; idx <= 32; idx++) {
            const masVal = mas_map[String(idx)]
            const menosVal = menos_map[String(idx)]
            if (masVal && menosVal && ['A','B','C','D'].includes(masVal) && ['A','B','C','D'].includes(menosVal)) {
              userResponses[idx] = {
                mas: masVal as 'A'|'B'|'C'|'D',
                menos: menosVal as 'A'|'B'|'C'|'D',
              }
            }
          }

          const rawScores = calculateRawScores(userResponses)
          const subcategoryScores = calculateSubcategoryScores(userResponses)
          const combinacion = determineStyleCombination(rawScores)
          const reportTexts = getReportFeedback(combinacion)

          // Generar imagen radar de forma headless (síncrona)
          const radarBase64 = renderRadarChartBase64(rawScores, subcategoryScores, combinacion)

          const { createDISCPdfDoc: buildDoc } = await import('@/components/disc/DISCPdfReport')
          const nombreCompleto2 = [perf?.nombre, perf?.primer_apellido, perf?.segundo_apellido]
            .filter(Boolean).join(' ') || 'evaluado'
          const { getBlob, fileName } = await buildDoc(
            {
              nombre: nombreCompleto2,
              cargo: perf?.dependencia_funciones || '',
              fecha: new Date().toLocaleDateString('es-CO'),
            },
            reportTexts,
            combinacion,
            rawScores,
            radarBase64
          )

          const arrayBuffer = await getBlob().arrayBuffer()
          zip.file(fileName || `DISC_${nombreCompleto.replace(/\s+/g, '_')}.pdf`, arrayBuffer)
        } catch (err) {
          console.error(`Error generando PDF para ${p.user_id}:`, err)
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informes_DISC_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Error generando ZIP:', err)
      alert('Ocurrió un error al generar el archivo ZIP. Por favor intente de nuevo.')
    } finally {
      setDescargandoZip(false)
      setZipProgreso(null)
    }
  }

  // --- EXPORTAR DISC ---
  async function exportar() {
    setExportando(true)
    try {
      const res = await fetch('/api/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: filtradas.map((p) => p.user_id),
        }),
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error al exportar resultados' }))
        alert(data.error || 'Error al exportar resultados DISC')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `disc_resultados_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error de conexión al exportar resultados')
    } finally {
      setExportando(false)
    }
  }

  // --- EXPORTAR USUARIOS ---
  async function exportarUsuarios() {
    setExportandoUsuarios(true)
    try {
      const res = await fetch('/api/admin/users/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: usuariosFiltrados.map(u => u.id) }),
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error al exportar' }))
        alert(data.error || 'Error al exportar usuarios')
        return
      }
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('spreadsheet') && !contentType.includes('octet-stream')) {
        alert('Error: la respuesta del servidor no es un archivo Excel')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `usuarios_registrados_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error de conexión al exportar usuarios')
    } finally {
      setExportandoUsuarios(false)
    }
  }

  // --- CREAR USUARIO ---
  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setGuardandoCrear(true)
    setMsgCrear(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataCrear),
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setMsgCrear({ tipo: 'error', texto: data.error || 'Error al crear usuario' })
        return
      }
      setMsgCrear({ tipo: 'ok', texto: `Usuario creado exitosamente (${formDataCrear.correo})` })
      setFormDataCrear(INITIAL_FORM)
      cargarUsuarios()
      router.refresh()
      setTimeout(() => {
        setMostrarModalCrear(false)
        setMsgCrear(null)
      }, 1200)
    } catch {
      setMsgCrear({ tipo: 'error', texto: 'Error de conexión con el servidor' })
    } finally {
      setGuardandoCrear(false)
    }
  }

  // --- EDITAR USUARIO ---
  function abrirEditar(u: UsuarioRegistrado) {
    setUsuarioEditar(u)
    setFormDataEditar({
      correo: u.correo || '',
      cedula: u.cedula || '',
      nombres: u.nombre || '',
      primer_apellido: u.primer_apellido || '',
      segundo_apellido: u.segundo_apellido || '',
      departamento: u.departamento || '',
      municipio: '',
      dependencia_funciones: u.dependencia_funciones || '',
      telefono: u.telefono || '',
    })
    setMsgEditar(null)
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioEditar) return
    setGuardandoEditar(true)
    setMsgEditar(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: usuarioEditar.id,
          ...formDataEditar,
        }),
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setMsgEditar({ tipo: 'error', texto: data.error || 'Error al actualizar usuario' })
        return
      }
      setMsgEditar({ tipo: 'ok', texto: 'Datos actualizados correctamente' })
      cargarUsuarios()
      router.refresh()
      setTimeout(() => {
        setUsuarioEditar(null)
        setMsgEditar(null)
      }, 1000)
    } catch {
      setMsgEditar({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setGuardandoEditar(false)
    }
  }

  // --- ELIMINAR USUARIO ---
  async function confirmarEliminar() {
    if (!usuarioEliminar) return
    setEliminandoUsuario(true)
    setMsgEliminar(null)
    try {
      const res = await fetch(`/api/admin/users?id=${usuarioEliminar.id}`, {
        method: 'DELETE',
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsgEliminar({ tipo: 'error', texto: data.error || 'Error al eliminar usuario' })
        return
      }
      setMsgEliminar({ tipo: 'ok', texto: `Usuario ${usuarioEliminar.nombre || ''} eliminado exitosamente` })
      setListaPersonas((prev) => prev.filter((p) => p.user_id !== usuarioEliminar.id))
      cargarUsuarios()
      router.refresh()
      setTimeout(() => {
        setUsuarioEliminar(null)
        setMsgEliminar(null)
      }, 1200)
    } catch {
      setMsgEliminar({ tipo: 'error', texto: 'Error de conexión al eliminar usuario' })
    } finally {
      setEliminandoUsuario(false)
    }
  }

  // --- CARGA MASIVA EXCEL / CSV ---
  async function procesarCargaMasiva(e: React.FormEvent) {
    e.preventDefault()
    if (!archivoCarga) return
    setCargandoArchivo(true)
    setResultadoCarga(null)
    try {
      const formData = new FormData()
      formData.append('file', archivoCarga)

      const res = await fetch('/api/admin/users/importar', {
        method: 'POST',
        body: formData,
      })
      if (res.status === 401) {
        router.push('/login?siguiente=/dashboard')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setResultadoCarga({
          ok: false,
          errorGeneral: data.error || 'Error al procesar el archivo',
        })
        return
      }
      setResultadoCarga({
        ok: true,
        total: data.total,
        creados: data.creados,
        actualizados: data.actualizados,
        fallidos: data.fallidos,
        errores: data.errores,
      })
      cargarUsuarios()
      router.refresh()
      if (fileInputRef.current) fileInputRef.current.value = ''
      setArchivoCarga(null)
    } catch {
      setResultadoCarga({
        ok: false,
        errorGeneral: 'Error de conexión al enviar el archivo',
      })
    } finally {
      setCargandoArchivo(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 flex flex-col">
      <div className="mx-auto max-w-7xl w-full flex-1">

        {/* Encabezado Principal — Compacto */}
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1F2937]">
            Resultados — Desarrollo de Líderes y Equipos
          </h1>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {listaPersonas.length} personas evaluadas
            {' · '}
            <span className="font-semibold text-[#00843D]">
              {totalCompletados} completaron ({pctCompletado}%)
            </span>
          </p>
        </div>

        {/* Tabs de Navegación */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tabla')}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-2 text-sm font-bold transition-colors ${activeTab === 'tabla'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              <Eye className="h-4 w-4" />
              Detalle por Persona (Resultados DISC)
            </button>
            <button
              onClick={() => setActiveTab('graficos')}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-2 text-sm font-bold transition-colors ${activeTab === 'graficos'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              Visión General y Mapas
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-2 text-sm font-bold transition-colors ${activeTab === 'usuarios'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              <Users className="h-4 w-4" />
              Gestión de Usuarios (CRUD y Administración)
            </button>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DETALLE POR PERSONA (RESULTADOS DISC)                               */}
        {/* ========================================================================= */}
        {activeTab === 'tabla' ? (
          <div className="space-y-4">
            {/* Barra de Filtros Actualizada */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.1fr_1.3fr_0.9fr_0.9fr_auto] gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
                  placeholder="Buscar por nombre o dependencia…"
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                />
              </div>

              <select
                value={filtroDepto}
                onChange={(e) => { setFiltroDepto(e.target.value); setFiltroDependencia('todos'); setPaginaActual(1) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black truncate"
              >
                <option value="todos">Departamento (Todos)</option>
                {departamentosUnicosMain.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={filtroDependencia}
                onChange={(e) => { setFiltroDependencia(e.target.value); setPaginaActual(1) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black truncate"
              >
                <option value="todos">Dependencia (Todas)</option>
                {dependenciasUnicasMain.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>

              <select
                value={filtroEstilo}
                onChange={(e) => { setFiltroEstilo(e.target.value); setPaginaActual(1) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
              >
                <option value="todos">Perfil (Todos)</option>
                {Object.entries(NOMBRE_ESTILO).map(([k, label]) => (
                  <option key={k} value={k}>{k} - {label}</option>
                ))}
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
              >
                <option value="todos">Estado (Todos)</option>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
              </select>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    setFiltroDepto('todos')
                    setFiltroDependencia('todos')
                    setFiltroEstilo('todos')
                    setFiltroEstado('todos')
                    setBusqueda('')
                    setPaginaActual(1)
                    setSelectedIds(new Set())
                  }}
                  className="flex-1 whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Limpiar
                </button>

                <button
                  onClick={exportar}
                  disabled={exportando || filtradas.length === 0}
                  className="inline-flex items-center justify-center rounded-lg bg-[#1F4E79] px-3 py-2 text-white shadow-sm transition hover:bg-[#173A5C] disabled:opacity-50"
                  title="Exportar resultados a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Barra de selección múltiple */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-[#1F4E79]/10 border border-[#1F4E79]/30 px-4 py-2.5">
                <span className="text-sm font-semibold text-[#1F4E79]">
                  {selectedIds.size} persona{selectedIds.size !== 1 ? 's' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  {zipProgreso && (
                    <span className="text-xs font-medium text-[#1F4E79] bg-white/70 px-2 py-1 rounded-lg">
                      Generando {zipProgreso.actual}/{zipProgreso.total}…
                    </span>
                  )}
                  <button
                    onClick={handleBulkDownload}
                    disabled={descargandoZip}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1F4E79] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#173A5C] disabled:opacity-60"
                  >
                    {descargandoZip ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <FileArchive className="h-4 w-4" />
                    )}
                    {descargandoZip ? 'Generando ZIP…' : 'Descargar seleccionados (.zip)'}
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 transition"
                    title="Quitar selección"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabla de Resultados DISC Optimizada */}
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        title="Seleccionar todos los completados"
                        checked={completadasFiltradas.length > 0 && selectedIds.size === completadasFiltradas.length}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < completadasFiltradas.length
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] accent-[#1F4E79] cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5">Nombre y Apellidos</th>
                    <th className="px-4 py-3.5">Departamento</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Dependencia</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5">Perfil DISC</th>
                    <th className="px-3 py-3.5 text-center font-bold text-xs" style={{ color: COLOR_ESTILO.D }}>D</th>
                    <th className="px-3 py-3.5 text-center font-bold text-xs" style={{ color: COLOR_ESTILO.I }}>I</th>
                    <th className="px-3 py-3.5 text-center font-bold text-xs" style={{ color: COLOR_ESTILO.S }}>S</th>
                    <th className="px-3 py-3.5 text-center font-bold text-xs" style={{ color: COLOR_ESTILO.C }}>C</th>
                    <th className="px-4 py-3.5 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginadas.map((p) => {
                    const perf = p.perfiles?.[0]
                    const nombreCompleto = [perf?.nombre, perf?.primer_apellido, perf?.segundo_apellido].filter(Boolean).join(' ') || 'Sin nombre'
                    const isSelected = selectedIds.has(p.user_id)
                    return (
                      <tr key={p.user_id} className={`transition-colors hover:bg-gray-50/70 ${isSelected ? 'bg-blue-50/60' : ''}`}>
                        <td className="px-4 py-3.5">
                          {p.completado ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(p.user_id)}
                              className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] accent-[#1F4E79] cursor-pointer"
                            />
                          ) : (
                            <span className="inline-block h-4 w-4" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {nombreCompleto}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs font-medium">
                          {perf?.departamento || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 min-w-[200px] max-w-[280px] whitespace-normal break-words leading-snug text-xs">
                          {perf?.dependencia_funciones || '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.completado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                              Completado (100%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              Pendiente ({p.porcentaje}%)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.completado && p.estilo_principal ? (
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                              style={{ backgroundColor: COLOR_ESTILO[p.estilo_principal] || '#1F4E79' }}
                            >
                              {p.perfil_combinado || p.estilo_principal}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 tabular-nums text-center font-bold text-sm" style={{ color: COLOR_ESTILO.D }}>
                          {p.d_global ?? <span className="text-gray-300 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3.5 tabular-nums text-center font-bold text-sm" style={{ color: COLOR_ESTILO.I }}>
                          {p.i_global ?? <span className="text-gray-300 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3.5 tabular-nums text-center font-bold text-sm" style={{ color: COLOR_ESTILO.S }}>
                          {p.s_global ?? <span className="text-gray-300 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3.5 tabular-nums text-center font-bold text-sm" style={{ color: COLOR_ESTILO.C }}>
                          {p.c_global ?? <span className="text-gray-300 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {p.completado ? (
                            <Link
                              href={`/dashboard/${p.user_id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1F4E79] bg-blue-50 transition hover:bg-[#1F4E79] hover:text-white"
                              title="Ver informe psicométrico individual"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center text-gray-300" title="Aún no ha realizado la evaluación">
                              <Eye className="h-4 w-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {paginadas.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-12 text-center text-gray-400">
                        {listaPersonas.length === 0
                          ? 'Aún no hay usuarios en el sistema.'
                          : 'No se encontraron personas con los filtros seleccionados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-semibold">{(paginaActual - 1) * REGISTROS_POR_PAGINA + 1}</span> a{' '}
                    <span className="font-semibold">
                      {Math.min(paginaActual * REGISTROS_POR_PAGINA, filtradas.length)}
                    </span>{' '}
                    de <span className="font-semibold">{filtradas.length}</span> personas
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-2">
                      {paginaActual} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'graficos' ? (
          /* ========================================================================= */
          /* TAB 2: VISIÓN GENERAL Y MAPAS DE CALOR                                    */
          /* ========================================================================= */
          <div className="space-y-6">
            {conScoring.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
                <div className="mb-4 flex justify-center">
                  <BarChart3 className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-700">Aún no hay resultados disponibles</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Cuando los evaluados completen la encuesta DISC, aquí aparecerán las gráficas de distribución
                  de estilos, patrones de equipo y mapa de calor por categorías.
                </p>
                {listaPersonas.length > 0 && (
                  <p className="mt-4 text-xs font-semibold text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full">
                    {listaPersonas.filter(p => !p.completado).length} evaluado(s) pendientes por finalizar.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <GraficosDashboard personas={conScoring as any[]} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <MapaCalor personas={conScoring as any[]} />
              </>
            )}
          </div>
        ) : activeTab === 'usuarios' ? (
          /* ========================================================================= */
          /* TAB 3: GESTIÓN DE USUARIOS (CRUD Y ADMINISTRACIÓN)                         */
          /* ========================================================================= */
          <div className="space-y-6">

            {/* Barra Unificada: Acciones + Filtros + Exportar */}
            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    value={busquedaUsuarios}
                    onChange={(e) => { setBusquedaUsuarios(e.target.value); setPaginaUsuarios(1) }}
                    placeholder="Buscar nombre, cédula, correo…"
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                  />
                </div>

                <select
                  value={filtroDepartamentoUsuarios}
                  onChange={(e) => { setFiltroDepartamentoUsuarios(e.target.value); setFiltroDependenciaUsuarios('todos'); setPaginaUsuarios(1) }}
                  className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-black truncate max-w-[155px]"
                >
                  <option value="todos">Depto (Todos)</option>
                  {departamentosUnicosUsuarios.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={filtroDependenciaUsuarios}
                  onChange={(e) => { setFiltroDependenciaUsuarios(e.target.value); setPaginaUsuarios(1) }}
                  className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-black truncate max-w-[165px]"
                >
                  <option value="todos">Depend. (Todas)</option>
                  {dependenciasUnicasUsuarios.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setBusquedaUsuarios('')
                    setFiltroDepartamentoUsuarios('todos')
                    setFiltroDependenciaUsuarios('todos')
                    setPaginaUsuarios(1)
                  }}
                  className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Limpiar
                </button>

                <button
                  onClick={exportarUsuarios}
                  disabled={exportandoUsuarios || usuariosFiltrados.length === 0}
                  className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg border border-[#1F4E79] bg-white px-3 py-2 text-sm font-bold text-[#1F4E79] shadow-sm transition hover:bg-blue-50 disabled:opacity-50"
                  title="Exportar usuarios"
                >
                  <Download className="h-4 w-4" />
                </button>

                <div className="hidden md:block w-px h-7 bg-gray-200 mx-0.5" />

                <button
                  onClick={() => {
                    setFormDataCrear(INITIAL_FORM)
                    setMsgCrear(null)
                    setMostrarModalCrear(true)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F4E79] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#173A5C]"
                >
                  <UserPlus className="h-4 w-4" />
                  Registrar
                </button>

                <button
                  onClick={() => {
                    setResultadoCarga(null)
                    setArchivoCarga(null)
                    setMostrarModalCarga(true)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F4E79] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#173A5C]"
                >
                  <FileUp className="h-4 w-4" />
                  Subir Excel
                </button>

                <button
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                  title="Actualizar directorio"
                >
                  <RefreshCw className={`h-4 w-4 ${cargandoUsuarios ? 'animate-spin' : ''}`} />
                </button>

                <p className="text-xs text-gray-500 font-medium ml-auto pl-2 border-l border-gray-200">
                  {usuariosFiltrados.length} usuario(s) registrados
                </p>
              </div>
            </div>

            {/* Tabla Completa de Administración de Usuarios */}
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5">Nombre y Apellidos</th>
                    <th className="px-4 py-3.5">Cédula / Documento</th>
                    <th className="px-4 py-3.5">Correo electrónico</th>
                    <th className="px-4 py-3.5">Teléfono</th>
                    <th className="px-4 py-3.5">Departamento</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Dependencia</th>
                    <th className="px-4 py-3.5">Fecha Registro</th>
                    <th className="px-4 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cargandoUsuarios ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                        <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-[#EA580C] border-t-transparent" />
                        <p className="mt-2 text-sm font-medium">Cargando base de datos de usuarios…</p>
                      </td>
                    </tr>
                  ) : usuariosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                        {usuariosRegistrados.length === 0
                          ? 'No hay usuarios registrados aún. Utiliza el botón "Registrar Usuario" o "Subir Excel / CSV".'
                          : 'Ningún usuario coincide con los filtros aplicados.'}
                      </td>
                    </tr>
                  ) : (
                    usuariosPaginados.map((u) => {
                      const nombreCompleto = [u.nombre, u.primer_apellido, u.segundo_apellido].filter(Boolean).join(' ') || 'Sin nombre'
                      return (
                        <tr key={u.id} className="transition-colors hover:bg-gray-50/70">
                          <td className="px-4 py-3.5 font-medium text-gray-900">
                            {nombreCompleto}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 font-mono text-xs">
                            {u.cedula || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 max-w-[200px] truncate" title={u.correo}>
                            {u.correo || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 tabular-nums text-xs">
                            {u.telefono || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                            {u.departamento || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 min-w-[200px] max-w-[280px] whitespace-normal break-words leading-snug text-xs">
                            {u.dependencia_funciones || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs tabular-nums whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => abrirEditar(u)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#1F4E79] hover:bg-blue-50 transition"
                                title="Editar datos del usuario"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setUsuarioEliminar(u)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Paginación de Usuarios */}
              {totalPaginasUsuarios > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-semibold">{(paginaUsuarios - 1) * USUARIOS_POR_PAGINA + 1}</span> a{' '}
                    <span className="font-semibold">
                      {Math.min(paginaUsuarios * USUARIOS_POR_PAGINA, usuariosFiltrados.length)}
                    </span>{' '}
                    de <span className="font-semibold">{usuariosFiltrados.length}</span> usuarios
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaUsuarios(p => Math.max(1, p - 1))}
                      disabled={paginaUsuarios === 1}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-2">
                      {paginaUsuarios} / {totalPaginasUsuarios}
                    </span>
                    <button
                      onClick={() => setPaginaUsuarios(p => Math.min(totalPaginasUsuarios, p + 1))}
                      disabled={paginaUsuarios === totalPaginasUsuarios}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR NUEVO USUARIO                                         */}
      {/* ========================================================================= */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Registrar Nuevo Usuario</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  La contraseña inicial será el número de cédula. Podrá ingresar inmediatamente.
                </p>
              </div>
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {msgCrear && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${msgCrear.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {msgCrear.tipo === 'ok'
                  ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                <span>{msgCrear.texto}</span>
              </div>
            )}

            <form onSubmit={crearUsuario} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Nombres <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={formDataCrear.nombres}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, nombres: e.target.value.toUpperCase() })}
                    placeholder="JUAN CARLOS"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Primer Apellido</label>
                  <input
                    value={formDataCrear.primer_apellido}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, primer_apellido: e.target.value.toUpperCase() })}
                    placeholder="PÉREZ"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Segundo Apellido</label>
                  <input
                    value={formDataCrear.segundo_apellido}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, segundo_apellido: e.target.value.toUpperCase() })}
                    placeholder="GÓMEZ"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Cédula <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={formDataCrear.cedula}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, cedula: e.target.value })}
                    placeholder="1020304050"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={formDataCrear.correo}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, correo: e.target.value })}
                    placeholder="usuario@procuraduria.gov.co"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formDataCrear.telefono}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, telefono: e.target.value })}
                    placeholder="300 123 4567"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Departamento</label>
                  <input
                    type="text"
                    list="sugerencias-departamentos"
                    value={formDataCrear.departamento}
                    onChange={(e) => setFormDataCrear({ ...formDataCrear, departamento: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                    placeholder="Buscar o escribir..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Dependencia / Funciones</label>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="text"
                      list="sugerencias-dependencias"
                      value={formDataCrear.dependencia_funciones}
                      onChange={(e) => setFormDataCrear({ ...formDataCrear, dependencia_funciones: e.target.value.toUpperCase() })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#EA580C] focus:outline-none"
                      placeholder="Buscar o escribir..."
                    />
                    <button
                      type="button"
                      onClick={() => abrirGestionDependencia('crear')}
                      className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-[#1F4E79] text-[#1F4E79] hover:bg-blue-50"
                      title="Crear una dependencia nueva"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCrear}
                  className="rounded-lg bg-[#1F4E79] px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#173A5C] disabled:opacity-50"
                >
                  {guardandoCrear ? 'Registrando…' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR DATOS PERSONALES DE USUARIO                               */}
      {/* ========================================================================= */}
      {usuarioEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Editar Datos Personales</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Actualiza la información del usuario en el sistema.
                </p>
              </div>
              <button
                onClick={() => setUsuarioEditar(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {msgEditar && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${msgEditar.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {msgEditar.tipo === 'ok'
                  ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                <span>{msgEditar.texto}</span>
              </div>
            )}

            <form onSubmit={guardarEdicion} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Nombres <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={formDataEditar.nombres}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, nombres: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Primer Apellido</label>
                  <input
                    value={formDataEditar.primer_apellido}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, primer_apellido: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Segundo Apellido</label>
                  <input
                    value={formDataEditar.segundo_apellido}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, segundo_apellido: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Cédula <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={formDataEditar.cedula}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, cedula: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={formDataEditar.correo}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, correo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formDataEditar.telefono}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, telefono: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Departamento</label>
                  <input
                    type="text"
                    list="sugerencias-departamentos"
                    value={formDataEditar.departamento}
                    onChange={(e) => setFormDataEditar({ ...formDataEditar, departamento: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                    placeholder="Buscar o escribir..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Dependencia / Funciones</label>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="text"
                      list="sugerencias-dependencias"
                      value={formDataEditar.dependencia_funciones}
                      onChange={(e) => setFormDataEditar({ ...formDataEditar, dependencia_funciones: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                      placeholder="Buscar o escribir..."
                    />
                    <button
                      type="button"
                      onClick={() => abrirGestionDependencia('editar')}
                      className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-[#1F4E79] text-[#1F4E79] hover:bg-blue-50"
                      title="Crear una dependencia nueva"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUsuarioEditar(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditar}
                  className="rounded-lg bg-[#1F4E79] px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#173A5C] disabled:opacity-50"
                >
                  {guardandoEditar ? 'Guardando…' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMAR ELIMINACIÓN DE USUARIO                                */}
      {/* ========================================================================= */}
      {usuarioEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar Usuario?</h3>
            </div>

            {msgEliminar && (
              <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${msgEliminar.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {msgEliminar.tipo === 'ok'
                  ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                <span>{msgEliminar.texto}</span>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Estás a punto de eliminar a <strong className="text-gray-900">{usuarioEliminar.nombre} {usuarioEliminar.primer_apellido}</strong> ({usuarioEliminar.correo}).
            </p>
            <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
              ⚠️ Esta acción eliminará su cuenta de acceso, perfil y sus respuestas/resultados asociados de forma permanente.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUsuarioEliminar(null)}
                disabled={eliminandoUsuario}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminandoUsuario}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {eliminandoUsuario ? 'Eliminando…' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CARGA MASIVA DE USUARIOS (EXCEL / CSV)                           */}
      {/* ========================================================================= */}
      {mostrarModalCarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-blue-100 p-2 text-[#1F4E79]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Carga Masiva de Usuarios (Excel / CSV)</h3>
                  <p className="text-xs text-gray-500">
                    Importa múltiples usuarios a la vez mediante un archivo de hoja de cálculo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalCarga(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Estructura Requerida */}
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-[#1F4E79] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-[#1F4E79] text-sm mb-1">Estructura requerida del archivo Excel</p>
                  <p className="mb-2">
                    El archivo debe incluir en la primera fila los siguientes encabezados (las columnas obligatorias son requeridas para crear la cuenta):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-blue-100">
                    <div><span className="text-red-600 font-bold">*</span> <strong>Nombres</strong></div>
                    <div>Primer Apellido</div>
                    <div>Segundo Apellido</div>
                    <div><span className="text-red-600 font-bold">*</span> <strong>Cédula</strong></div>
                    <div><span className="text-red-600 font-bold">*</span> <strong>Correo</strong></div>
                    <div>Teléfono</div>
                    <div>Departamento</div>
                    <div>Dependencia Funciones</div>
                  </div>
                  <p className="mt-2 text-gray-600">
                    ℹ️ <strong>Contraseña inicial:</strong> La contraseña asignada a cada usuario para ingresar será su número de <strong>Cédula</strong>.
                  </p>
                </div>
              </div>

              {/* Botón Descargar Plantilla */}
              <div className="mt-3 flex justify-end">
                <a
                  href="/api/admin/users/plantilla"
                  download="plantilla_carga_usuarios.xlsx"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#1F4E79] px-3.5 py-1.5 text-xs font-bold text-[#1F4E79] shadow-xs hover:bg-blue-50 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar Plantilla Modelo (.xlsx)
                </a>
              </div>
            </div>

            {/* Formulario de Subida */}
            <form onSubmit={procesarCargaMasiva} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selecciona el archivo Excel (.xlsx, .xls) o .csv:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setArchivoCarga(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1F4E79] file:text-white hover:file:bg-[#173A5C] file:cursor-pointer cursor-pointer border border-gray-300 rounded-lg p-1.5"
                />
              </div>

              {/* Resultado de la carga */}
              {resultadoCarga && (
                <div className={`p-4 rounded-xl text-sm ${resultadoCarga.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {resultadoCarga.ok ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-800 font-bold mb-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Carga procesada exitosamente
                      </div>
                      <p className="text-xs text-green-700">
                        Total procesados: <strong>{resultadoCarga.total}</strong> | Creados: <strong>{resultadoCarga.creados}</strong> | Actualizados: <strong>{resultadoCarga.actualizados}</strong>
                      </p>
                      {resultadoCarga.fallidos && resultadoCarga.fallidos > 0 ? (
                        <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded">
                          <p className="font-semibold">Observaciones ({resultadoCarga.fallidos} filas omitidas):</p>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-28 overflow-y-auto">
                            {resultadoCarga.errores?.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <span>{resultadoCarga.errorGeneral}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalCarga(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={!archivoCarga || cargandoArchivo}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F4E79] px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#173A5C] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {cargandoArchivo ? 'Procesando archivo…' : 'Subir e Importar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mini-modal: Gestión rápida de dependencia (botón "+" junto al campo Dependencia) */}
      {altaDependenciaPara && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Building2 className="h-5 w-5 text-[#1F4E79]" />
                Dependencias
              </h3>
              <button onClick={() => setAltaDependenciaPara(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector de modo: crear nueva vs editar/eliminar existente */}
            <div className="mb-4 flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
              <button
                onClick={() => { setModoGestionDep('crear'); setNuevaDepForm({ nombre: '', departamento: '' }); setDepSeleccionada(null); setMsgNuevaDep(null) }}
                className={`flex-1 rounded-md py-1.5 transition ${modoGestionDep === 'crear' ? 'bg-white shadow-sm text-[#1F4E79]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Crear nueva
              </button>
              <button
                onClick={() => { setModoGestionDep('existente'); setNuevaDepForm({ nombre: '', departamento: '' }); setDepSeleccionada(null); setMsgNuevaDep(null) }}
                className={`flex-1 rounded-md py-1.5 transition ${modoGestionDep === 'existente' ? 'bg-white shadow-sm text-[#1F4E79]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Editar / Eliminar
              </button>
            </div>

            {msgNuevaDep && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{msgNuevaDep}</div>
            )}

            {modoGestionDep === 'existente' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700">Buscar dependencia existente</label>
                <input
                  type="text"
                  list="sugerencias-dependencias"
                  defaultValue=""
                  onChange={(e) => seleccionarDependenciaExistente(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                  placeholder="Escribe para buscar..."
                  autoFocus
                />
                {!depSeleccionada && (
                  <p className="mt-1 text-xs text-gray-400">Escribe el nombre exacto de una dependencia del catálogo para editarla o eliminarla.</p>
                )}
              </div>
            )}

            {(modoGestionDep === 'crear' || depSeleccionada) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Nombre de la dependencia</label>
                  <input
                    type="text"
                    value={nuevaDepForm.nombre}
                    onChange={(e) => setNuevaDepForm({ ...nuevaDepForm, nombre: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                    placeholder="PROCURADURIA REGIONAL DE INSTRUCCION..."
                    autoFocus={modoGestionDep === 'crear'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Departamento (opcional)</label>
                  <input
                    type="text"
                    list="sugerencias-departamentos"
                    value={nuevaDepForm.departamento}
                    onChange={(e) => setNuevaDepForm({ ...nuevaDepForm, departamento: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none"
                    placeholder="Buscar o escribir un departamento..."
                  />
                </div>

                {modoGestionDep === 'existente' && depSeleccionada && confirmarEliminarDep && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    ¿Seguro que deseas eliminar <strong>{depSeleccionada.nombre}</strong> del catálogo? Esto no afecta a las personas que ya la tengan asignada, solo deja de aparecer como opción para nuevos registros.
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setConfirmarEliminarDep(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                        Cancelar
                      </button>
                      <button
                        onClick={handleEliminarDependenciaRapida}
                        disabled={eliminandoDepRapida}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {eliminandoDepRapida ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              {modoGestionDep === 'existente' && depSeleccionada ? (
                <button
                  onClick={() => setConfirmarEliminarDep(true)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              ) : <span />}
              <div className="flex gap-3">
                <button
                  onClick={() => setAltaDependenciaPara(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                {modoGestionDep === 'crear' ? (
                  <button
                    onClick={handleCrearDependenciaRapida}
                    disabled={guardandoNuevaDep || !nuevaDepForm.nombre}
                    className="rounded-lg bg-[#1F4E79] px-4 py-2 text-sm font-semibold text-white hover:bg-[#183d61] disabled:opacity-50"
                  >
                    {guardandoNuevaDep ? 'Creando...' : 'Crear y usar'}
                  </button>
                ) : (
                  <button
                    onClick={handleActualizarDependenciaRapida}
                    disabled={guardandoNuevaDep || !depSeleccionada || !nuevaDepForm.nombre}
                    className="rounded-lg bg-[#1F4E79] px-4 py-2 text-sm font-semibold text-white hover:bg-[#183d61] disabled:opacity-50"
                  >
                    {guardandoNuevaDep ? 'Guardando...' : 'Guardar y usar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sugerencias para los combobox de Departamento y Dependencia (buscar o escribir) */}
      <datalist id="sugerencias-departamentos">
        {sugerenciasDepartamentos.map((d) => <option key={d} value={d} />)}
      </datalist>
      <datalist id="sugerencias-dependencias">
        {Array.from(new Set([...catalogoDependencias, ...usuariosRegistrados.map(u => u.dependencia_funciones).filter(Boolean)])).sort().map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      {/* Footer Institucional */}
      <footer className="mt-16 w-full border-t border-gray-200 pt-8 pb-4 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Rizoma Consultoría y Desarrollo • Sistema de Evaluación de Líderes y Equipos
        </p>
      </footer>
    </div>
  )
}
