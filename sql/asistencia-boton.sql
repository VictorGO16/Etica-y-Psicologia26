-- Ejecutar después de asistencia.sql. Conserva tomas y registros existentes.
BEGIN;
ALTER TABLE asistencia_sessions ADD COLUMN IF NOT EXISTS show_button boolean;
-- Conserva el comportamiento previo únicamente al agregar la opción.
UPDATE asistencia_sessions SET show_button=require_location WHERE show_button IS NULL;
ALTER TABLE asistencia_sessions ALTER COLUMN show_button SET DEFAULT false;
ALTER TABLE asistencia_sessions ALTER COLUMN show_button SET NOT NULL;

-- Sobrecarga: la activación y la elección del botón quedan en la misma transacción.
CREATE OR REPLACE FUNCTION asistencia_activate(
  p_id uuid, p_date date, p_module integer, p_token uuid, p_minutes integer,
  p_location boolean, p_lat double precision, p_lng double precision,
  p_replace boolean, p_expected uuid, p_button boolean
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb; s asistencia_sessions;
BEGIN
  IF p_button IS NULL THEN RETURN jsonb_build_object('error','invalid'); END IF;
  result := asistencia_activate(p_id,p_date,p_module,p_token,p_minutes,p_location,p_lat,p_lng,p_replace,p_expected);
  IF result ? 'error' THEN RETURN result; END IF;
  UPDATE asistencia_sessions SET show_button=p_button
    WHERE id=(result->'session'->>'id')::uuid RETURNING * INTO s;
  RETURN jsonb_build_object('session',to_jsonb(s));
END $$;

CREATE OR REPLACE FUNCTION asistencia_button(p_id uuid, p_token uuid, p_show boolean)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE s asistencia_sessions;
BEGIN
  IF p_show IS NULL THEN RETURN jsonb_build_object('error','invalid'); END IF;
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(s.class_date::text || ':' || s.module::text, 0));
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  IF s.token IS DISTINCT FROM p_token THEN RETURN jsonb_build_object('error','changed'); END IF;
  UPDATE asistencia_sessions SET show_button=p_show WHERE id=p_id RETURNING * INTO s;
  RETURN jsonb_build_object('session',to_jsonb(s));
END $$;
COMMIT;
