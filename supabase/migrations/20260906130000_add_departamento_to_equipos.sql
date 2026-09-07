-- Migration: Add departamento column to equipos
-- Description: Each dependencia (equipos row) is now related to a departamento
-- (free text, matching the departamento already used on perfiles), replacing the
-- old lugar_id (Bogota/Territorios) grouping from the previous version of the
-- registration form. lugar_id is kept untouched for backwards compatibility.

alter table equipos add column if not exists departamento text;
