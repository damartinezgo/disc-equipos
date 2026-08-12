-- Migration: auto-create perfiles on new auth user
-- Description: Trigger to insert a perfil row when a new user signs up

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

  insert into public.perfiles (id, nombre, lugar, equipo, terminos_aceptados)
  values (
    new.id,
    v_nombre,
    new.raw_user_meta_data->>'lugar',
    new.raw_user_meta_data->>'equipo',
    coalesce((new.raw_user_meta_data->>'terminos_aceptados')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert
  on auth.users
  for each row
  execute function public.handle_new_user();
