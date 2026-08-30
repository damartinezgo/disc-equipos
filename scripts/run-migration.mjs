import fs from 'fs'

// Lee variables de entorno directamente de .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.replace(/\r/g, '').split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/)
  if (match) {
    let value = (match[2] || '').trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan claves de Supabase en .env.local')
  process.exit(1)
}

// Execute SQL statements one at a time via the Supabase REST SQL endpoint
const sqlStatements = [
  `alter table perfiles add column if not exists cedula text;`,
  `alter table perfiles add column if not exists primer_apellido text;`,
  `alter table perfiles add column if not exists segundo_apellido text;`,
  `alter table perfiles add column if not exists departamento text;`,
  `alter table perfiles add column if not exists municipio text;`,
  `alter table perfiles add column if not exists dependencia_funciones text;`,
  `alter table perfiles add column if not exists telefono text;`,
  // Update trigger function
  `create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_nombre text;
begin
  v_nombre := new.raw_user_meta_data->>'nombre';
  if v_nombre is null or v_nombre = '' then
    v_nombre := 'Sin nombre';
  end if;

  insert into public.perfiles (id, nombre, lugar, equipo, terminos_aceptados, cedula, primer_apellido, segundo_apellido, departamento, municipio, dependencia_funciones, telefono)
  values (
    new.id,
    v_nombre,
    new.raw_user_meta_data->>'lugar',
    new.raw_user_meta_data->>'equipo',
    coalesce((new.raw_user_meta_data->>'terminos_aceptados')::boolean, false),
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'primer_apellido',
    new.raw_user_meta_data->>'segundo_apellido',
    new.raw_user_meta_data->>'departamento',
    new.raw_user_meta_data->>'municipio',
    new.raw_user_meta_data->>'dependencia_funciones',
    new.raw_user_meta_data->>'telefono'
  );
  return new;
end;
$$;`
]

async function runMigration() {
  console.log('Ejecutando migración de columnas en perfiles...\n')
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i]
    const label = sql.split('\n')[0].substring(0, 60)
    console.log(`[${i + 1}/${sqlStatements.length}] ${label}...`)
    
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })

    // If rpc/ doesn't work, use the SQL endpoint directly
    if (!res.ok) {
      // Try using the pg-meta SQL endpoint
      const res2 = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      
      if (!res2.ok) {
        // As a last resort, use the raw SQL via supabase-js
        console.log(`  ⚠ API endpoints no disponibles, intentando con supabase-js...`)
        break
      } else {
        console.log(`  ✓ OK`)
      }
    } else {
      console.log(`  ✓ OK`)
    }
  }
}

// Alternative: use @supabase/supabase-js with rpc
async function runMigrationViaRpc() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  })

  // Try to run each ALTER TABLE individually by using .rpc or direct fetch to SQL API
  // Supabase hosted has a SQL endpoint at /rest/v1/rpc but requires a function
  // Let's just use the REST API to check if the columns exist first
  
  const { data, error } = await supabase.from('perfiles').select('id').limit(1)
  if (error) {
    console.error('Error connecting to perfiles:', error.message)
    process.exit(1)
  }
  
  console.log('Conexión OK. Intentando verificar columnas...')
  
  // Try selecting one of the new columns
  const { error: colErr } = await supabase.from('perfiles').select('cedula').limit(1)
  
  if (colErr && colErr.message.includes('does not exist')) {
    console.log('\nLas columnas NO existen. Necesitas ejecutar el SQL manualmente.')
    console.log('\n📋 Copia y pega este SQL en el SQL Editor de Supabase Dashboard:\n')
    console.log('='.repeat(60))
    const migrationSQL = fs.readFileSync('supabase/migrations/20260829160000_add_user_profile_fields.sql', 'utf8')
    console.log(migrationSQL)
    console.log('='.repeat(60))
    console.log('\n🔗 Ve a: https://supabase.com/dashboard → tu proyecto → SQL Editor')
    console.log('Pega el SQL y haz click en "Run"\n')
  } else if (colErr) {
    console.error('Error desconocido:', colErr.message)
  } else {
    console.log('✅ La columna "cedula" ya existe. La migración ya fue aplicada.')
    
    // Now update perfiles rows from user_metadata for users that have nulls
    console.log('\nActualizando perfiles desde user_metadata...')
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    let updated = 0
    
    for (const u of users) {
      if (!u.user_metadata?.cedula) continue
      
      const { error: upErr } = await supabase.from('perfiles').update({
        cedula: u.user_metadata.cedula || null,
        primer_apellido: u.user_metadata.primer_apellido || null,
        segundo_apellido: u.user_metadata.segundo_apellido || null,
        departamento: u.user_metadata.departamento || null,
        dependencia_funciones: u.user_metadata.dependencia_funciones || null,
        telefono: u.user_metadata.telefono || null,
      }).eq('id', u.id)
      
      if (!upErr) updated++
    }
    console.log(`✅ ${updated} perfiles actualizados`)
  }
}

// Run
runMigrationViaRpc().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
