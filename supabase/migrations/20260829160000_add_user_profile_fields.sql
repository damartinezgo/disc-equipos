-- Migration: Add new profile fields for admin-managed user registration
-- Description: Adds cedula, primer_apellido, segundo_apellido, departamento, municipio, dependencia_funciones, telefono to perfiles

alter table perfiles add column if not exists cedula text;
alter table perfiles add column if not exists primer_apellido text;
alter table perfiles add column if not exists segundo_apellido text;
alter table perfiles add column if not exists departamento text;
alter table perfiles add column if not exists municipio text;
alter table perfiles add column if not exists dependencia_funciones text;
alter table perfiles add column if not exists telefono text;

-- Update the trigger function to handle new fields
create or replace function public.handle_new_user()
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
$$;
