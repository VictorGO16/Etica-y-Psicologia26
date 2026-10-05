-- Actualización para bases donde ya se ejecutó asistencia.sql.
-- Solo define la operación; ejecutar este archivo no borra ninguna toma.
BEGIN;
CREATE OR REPLACE FUNCTION asistencia_delete(p_id uuid, p_token uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE s asistencia_sessions; n integer;
BEGIN
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(s.class_date::text || ':' || s.module::text, 0));
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  IF s.token IS DISTINCT FROM p_token THEN RETURN jsonb_build_object('error','changed'); END IF;
  SELECT count(*) INTO n FROM asistencia_records WHERE session_id=p_id;
  -- La FK ON DELETE CASCADE elimina únicamente los registros de esta toma.
  DELETE FROM asistencia_sessions WHERE id=p_id;
  RETURN jsonb_build_object('deleted',true,'count',n);
END $$;
COMMIT;
