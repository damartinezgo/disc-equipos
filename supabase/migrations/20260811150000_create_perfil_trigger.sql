-- Migration: auto-create perfiles on new auth user
-- Description: Trigger to insert a perfil row when a new user signs up

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.perfiles (id, nombre, lugar, equipo, terminos_aceptados)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'lugar',
    new.raw_user_meta_data->>'equipo',
    (new.raw_user_meta_data->>'terminos_aceptados')::boolean
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
