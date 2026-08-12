"use client";

import { useState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import TerminosModal from "@/components/terminos-modal";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";

type Lugar = { id: number; nombre: string };
type Equipo = { id: number; nombre: string };
type Paso = "email" | "codigo" | "formulario";

export default function RegistroPage() {
  const router = useRouter();

  function handleBack() {
    if (paso === "formulario") {
      setPaso("codigo");
      return;
    }
    if (paso === "codigo") {
      setPaso("email");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigoBoxes, setCodigoBoxes] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [nombre, setNombre] = useState("");
  const [lugarId, setLugarId] = useState("");
  const [equipo, setEquipo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const codigoRefs = useRef<(HTMLInputElement | null)[]>([]);

  const lugarSelectId = useId();
  const equipoSelectId = useId();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = sessionStorage.getItem("login_email");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    async function cargarLugares() {
      try {
        const res = await fetch("/api/lugares");
        const data = await res.json();
        setLugares(Array.isArray(data) ? data : []);
      } catch {
        // error silencioso
      }
    }
    cargarLugares();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && email) {
      sessionStorage.setItem("login_email", email);
    }
  }, [email]);

  useEffect(() => {
    async function cargarEquipos() {
      if (!lugarId) {
        setEquipos([]);
        return;
      }
      setCargandoEquipos(true);
      try {
        const res = await fetch(`/api/equipos?lugar_id=${lugarId}`);
        const data = await res.json();
        setEquipos(Array.isArray(data) ? data : []);
      } catch {
        // error silencioso
      } finally {
        setCargandoEquipos(false);
      }
      setEquipo("");
    }
    cargarEquipos();
  }, [lugarId]);

  const lugarNombre =
    lugares.find((l) => String(l.id) === lugarId)?.nombre ?? "";

  useEffect(() => {
    if (segundosReenvio > 0) {
      const timer = setTimeout(
        () => setSegundosReenvio(segundosReenvio - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [segundosReenvio]);

  function validarEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validarEmail(email)) {
      setError("Ingresa un correo válido.");
      return;
    }

    setCargando(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();

    setCargando(false);

    if (!res.ok) {
      if (result.error?.includes("registrado")) {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (
        result.error?.includes("rate") ||
        result.error?.includes("límite")
      ) {
        setError(
          "Ya enviamos un código recientemente. Por favor esperá antes de reenviar.",
        );
      } else {
        setError(
          result.error || "No se pudo enviar el código. Intenta de nuevo.",
        );
      }
      return;
    }

    setPaso("codigo");
    setSegundosReenvio(60);
  }

  async function reenviarCodigo() {
    if (segundosReenvio > 0) return;
    setReenviando(true);
    setError(null);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();

    setReenviando(false);

    if (!res.ok) {
      setError(result.error || "No se pudo reenviar el código.");
    } else {
      setSegundosReenvio(60);
    }
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const codigoCombinado = codigoBoxes.join("");

    if (codigoCombinado.length < 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }

    setCargando(true);

    const res = await fetch("/api/otp/verify", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ email, code: codigoCombinado, purpose: "signup" }),
     });
     const result = await res.json();

     setCargando(false);

     if (!res.ok || !result.ok) {
       setError(
         result.error ||
           result.message ||
           "Código inválido o expirado. Verificá el código e intenta de nuevo.",
       );
       return;
     }

     setPaso("formulario");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!lugarId || !equipo) {
      setError("Selecciona un lugar y una dependencia.");
      return;
    }

    if (!acepto) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!email) {
      setError(
        "No se pudo identificar la sesión. Intenta de nuevo desde el inicio.",
      );
      return;
    }

    setCargando(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        nombre,
        lugar: lugarNombre,
        equipo,
      }),
    });
    const result = await res.json();

    setCargando(false);

    if (!res.ok) {
      setError(
        result.error || "No se pudo completar el registro. Intenta de nuevo.",
      );
      return;
    }

    window.location.href = "/carga";
  }

  function confirmarTerminos() {
    setAcepto(true);
    setMostrarTerminos(false);
  }

  return (
    <>
      <main
        suppressHydrationWarning
        className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4"
      >
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-gray-800"
          aria-label="Volver atrás"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <img
                src="/logo-rizoma.svg"
                alt="Desarrollo de Líderes y Equipo"
                className="h-36 w-auto cursor-pointer transition-transform hover:scale-105"
              />
            </Link>
          </div>

          <div className="mb-6 flex items-center justify-center gap-1.5">
            <div
              className={`h-2 w-8 rounded-full ${paso === "email" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
            <div
              className={`h-2 w-8 rounded-full ${paso === "codigo" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
            <div
              className={`h-2 w-8 rounded-full ${paso === "formulario" ? "bg-[#1F4E79]" : "bg-gray-200"}`}
            />
          </div>

          {paso === "email" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Crear cuenta
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tu correo. Te enviaremos un código de verificación para
                confirmar la cuenta.
              </p>

              <form onSubmit={enviarCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cargando || !email}
                    className="w-full rounded-lg bg-[#1F4E79] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cargando ? "Enviando…" : "Enviar código de verificación"}
                  </button>
                </div>
              </form>
            </>
          )}

          {paso === "codigo" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Verificar correo
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa el código de 6 dígitos que enviamos a{" "}
                <span className="font-medium text-[#1F2937]">{email}</span>.
              </p>

              <form onSubmit={verificarCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Código de verificación
                  </label>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    {codigoBoxes.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 1);
                          const newBoxes = [...codigoBoxes];
                          newBoxes[idx] = val;
                          setCodigoBoxes(newBoxes);
                          if (val && idx < 5) {
                            codigoRefs.current[idx + 1]?.focus();
                          }
                          if (
                            val &&
                            newBoxes.join("").length === 6 &&
                            idx === 5
                          ) {
                            setTimeout(() => {
                              const form = e.target.closest("form");
                              form?.requestSubmit();
                            }, 150);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !codigoBoxes[idx] &&
                            idx > 0
                          ) {
                            codigoRefs.current[idx - 1]?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          const paste = e.clipboardData
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, 6 - idx);
                          if (paste) {
                            e.preventDefault();
                            const newBoxes = [...codigoBoxes];
                            for (let i = 0; i < paste.length; i++) {
                              if (idx + i < 6) {
                                newBoxes[idx + i] = paste[i];
                              }
                            }
                            setCodigoBoxes(newBoxes);
                            if (newBoxes.join("").length === 6) {
                              setTimeout(() => {
                                const form = e.currentTarget.closest("form");
                                form?.requestSubmit();
                              }, 150);
                            } else {
                              const lastIdx = Math.min(
                                idx + paste.length - 1,
                                5,
                              );
                              codigoRefs.current[lastIdx]?.focus();
                            }
                          }
                        }}
                        ref={(el) => {
                          codigoRefs.current[idx] = el;
                        }}
                        id={`codigo-${idx}`}
                        className="h-12 w-10 rounded-lg border border-gray-400 text-center text-xl font-medium text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cargando || codigoBoxes.join("").length < 6}
                    className="w-full rounded-lg bg-[#1F4E79] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cargando ? "Verificando…" : "Verificar código"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={reenviarCodigo}
                  disabled={reenviando || segundosReenvio > 0}
                  className="w-full text-center text-sm font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C] hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {reenviando
                    ? "Reenviando…"
                    : segundosReenvio > 0
                      ? `Reenviar código (${segundosReenvio}s)`
                      : "Reenviar código"}
                </button>
              </form>
            </>
          )}

          {paso === "formulario" && (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">
                Crear cuenta
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Completa tus datos para terminar el registro.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    required
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lugar
                  </label>
                  <Select
                    required
                    instanceId={lugarSelectId}
                    value={
                      lugarId
                        ? {
                            value: lugarId,
                            label:
                              lugares.find((l) => String(l.id) === lugarId)
                                ?.nombre ?? "",
                          }
                        : null
                    }
                    onChange={(opt) => {
                      setLugarId(opt ? opt.value : "");
                      setEquipo("");
                    }}
                    options={lugares.map((l) => ({
                      value: String(l.id),
                      label: l.nombre,
                    }))}
                    placeholder="Selecciona un lugar"
                    classNames={{
                      control: () => "border-gray-300 text-black",
                      menu: () => "z-50",
                      option: ({ isFocused }) =>
                        isFocused
                          ? "bg-[#1F4E79]/10 cursor-pointer"
                          : "cursor-pointer",
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "42px",
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        backgroundColor: "white",
                        "&:hover": { borderColor: "#9ca3af" },
                      }),
                      menu: (base) => ({ ...base, zIndex: 50 }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        color: "#111827",
                        backgroundColor: isFocused
                          ? "rgba(31, 78, 121, 0.1)"
                          : undefined,
                        cursor: "pointer",
                      }),
                      singleValue: (base) => ({ ...base, color: "#111827" }),
                      placeholder: (base) => ({ ...base, color: "#6b7280" }),
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dependencia
                  </label>
                  <Select
                    required
                    instanceId={equipoSelectId}
                    isDisabled={!lugarId || cargandoEquipos}
                    value={equipo ? { value: equipo, label: equipo } : null}
                    onChange={(opt) => setEquipo(opt ? opt.value : "")}
                    options={equipos.map((e) => ({
                      value: e.nombre,
                      label: e.nombre,
                    }))}
                    placeholder={
                      cargandoEquipos
                        ? "Cargando..."
                        : !lugarId
                          ? "Selecciona un lugar"
                          : "Selecciona o escribe una dependencia"
                    }
                    classNames={{
                      control: () => "border-gray-300 text-black",
                      menu: () => "z-50",
                      option: ({ isFocused }) =>
                        isFocused
                          ? "bg-[#1F4E79]/10 cursor-pointer"
                          : "cursor-pointer",
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "42px",
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        backgroundColor: "white",
                        "&:hover": { borderColor: "#9ca3af" },
                      }),
                      menu: (base) => ({ ...base, zIndex: 50 }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        color: "#111827",
                        backgroundColor: isFocused
                          ? "rgba(31, 78, 121, 0.1)"
                          : undefined,
                        cursor: "pointer",
                      }),
                      singleValue: (base) => ({ ...base, color: "#111827" }),
                      placeholder: (base) => ({ ...base, color: "#6b7280" }),
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    placeholder="tu@correo.com"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarPassword ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 pr-10 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarConfirm ? "text" : "password"}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 pr-10 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirm(!mostrarConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={
                        mostrarConfirm
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarConfirm ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={acepto}
                      onChange={(e) => {
                        setAcepto(e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-400 text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    Acepto los
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarTerminos(true)}
                    className="text-sm font-semibold text-[#EA580C] underline underline-offset-2 transition-colors hover:text-[#C2410C]"
                  >
                    Términos y condiciones
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cargando || !lugarId || !equipo || !acepto}
                    className="w-full rounded-lg bg-[#1F4E79] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cargando ? "Creando cuenta…" : "Crear cuenta y comenzar"}
                  </button>
                </div>
              </form>
            </>
          )}

          {paso !== "formulario" && (
            <div className="mt-8 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C] hover:underline"
              >
                Inicia sesión
              </Link>
            </div>
          )}

          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-700">{error}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setError(null)}
                    className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {mostrarTerminos && (
        <TerminosModal
          onAccept={confirmarTerminos}
          onClose={() => setMostrarTerminos(false)}
        />
      )}
    </>
  );
}
