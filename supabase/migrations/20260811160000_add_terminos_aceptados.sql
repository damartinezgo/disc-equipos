-- Migration: add terminos_aceptados to perfiles
-- Description: Store terms acceptance in DB so it persists across browsers/devices
alter table perfiles add column if not exists terminos_aceptados boolean default false;

-- Backfill existing perfiles with true (they accepted during registration or pre-date this column)
update perfiles set terminos_aceptados = true where terminos_aceptados is false;
