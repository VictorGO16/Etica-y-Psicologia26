-- Ejecutar una vez en Neon SQL Editor, en la base que usa DATABASE_URL.
-- Puede repetirse: no elimina asistencias existentes. La nómina se añade al final.
BEGIN;

CREATE TABLE IF NOT EXISTS asistencia_students (
  id integer PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE IF NOT EXISTS asistencia_sessions (
  id uuid PRIMARY KEY,
  class_date date NOT NULL CHECK (EXTRACT(ISODOW FROM class_date) = 1),
  module smallint NOT NULL CHECK (module BETWEEN 1 AND 3),
  token uuid NOT NULL UNIQUE,
  opened_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  require_location boolean NOT NULL DEFAULT false,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  UNIQUE (class_date, module)
);
CREATE TABLE IF NOT EXISTS asistencia_records (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES asistencia_sessions(id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES asistencia_students(id),
  device_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  location_checked boolean NOT NULL,
  UNIQUE (session_id, student_id),
  UNIQUE (session_id, device_id)
);

-- La misma exclusión por fecha/módulo serializa activar, ampliar y registrar.
-- Confirmación con token esperado: una pantalla antigua no puede borrar otra toma.
CREATE OR REPLACE FUNCTION asistencia_activate(
  p_id uuid, p_date date, p_module integer, p_token uuid, p_minutes integer,
  p_location boolean, p_lat double precision, p_lng double precision,
  p_replace boolean, p_expected uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE s asistencia_sessions; n integer;
BEGIN
  IF p_minutes NOT BETWEEN 1 AND 240 OR p_module NOT BETWEEN 1 AND 3
     OR EXTRACT(ISODOW FROM p_date) <> 1 OR p_lat NOT BETWEEN -90 AND 90
     OR p_lng NOT BETWEEN -180 AND 180 THEN
    RETURN jsonb_build_object('error','invalid');
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_date::text || ':' || p_module::text, 0));
  SELECT * INTO s FROM asistencia_sessions WHERE class_date=p_date AND module=p_module FOR UPDATE;
  IF FOUND THEN
    SELECT count(*) INTO n FROM asistencia_records WHERE session_id=s.id;
    IF NOT p_replace THEN RETURN jsonb_build_object('error','confirm','count',n,'token',s.token); END IF;
    IF p_expected IS DISTINCT FROM s.token THEN RETURN jsonb_build_object('error','changed'); END IF;
    DELETE FROM asistencia_records WHERE session_id=s.id;
    UPDATE asistencia_sessions SET token=p_token, opened_at=clock_timestamp(),
      expires_at=clock_timestamp()+make_interval(mins=>p_minutes), require_location=p_location,
      latitude=p_lat, longitude=p_lng WHERE id=s.id RETURNING * INTO s;
  ELSE
    IF p_replace THEN RETURN jsonb_build_object('error','changed'); END IF;
    INSERT INTO asistencia_sessions(id,class_date,module,token,opened_at,expires_at,require_location,latitude,longitude)
      VALUES(p_id,p_date,p_module,p_token,clock_timestamp(),clock_timestamp()+make_interval(mins=>p_minutes),p_location,p_lat,p_lng)
      RETURNING * INTO s;
  END IF;
  RETURN jsonb_build_object('session',to_jsonb(s));
END $$;

CREATE OR REPLACE FUNCTION asistencia_extend(p_id uuid, p_token uuid, p_minutes integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE s asistencia_sessions;
BEGIN
  IF p_minutes NOT BETWEEN 1 AND 240 THEN RETURN jsonb_build_object('error','invalid'); END IF;
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(s.class_date::text || ':' || s.module::text, 0));
  SELECT * INTO s FROM asistencia_sessions WHERE id=p_id FOR UPDATE;
  IF s.token IS DISTINCT FROM p_token THEN RETURN jsonb_build_object('error','changed'); END IF;
  UPDATE asistencia_sessions SET expires_at=GREATEST(expires_at,clock_timestamp())+make_interval(mins=>p_minutes)
    WHERE id=p_id RETURNING * INTO s;
  RETURN jsonb_build_object('session',to_jsonb(s));
END $$;

-- Coordenadas del estudiante nunca entran a SQL: se comprueban transitoriamente en la API.
CREATE OR REPLACE FUNCTION asistencia_submit(p_token uuid, p_student integer, p_device uuid, p_checked boolean)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE s asistencia_sessions; r asistencia_records;
BEGIN
  SELECT * INTO s FROM asistencia_sessions WHERE token=p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','closed'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(s.class_date::text || ':' || s.module::text, 0));
  SELECT * INTO s FROM asistencia_sessions WHERE token=p_token FOR UPDATE;
  IF NOT FOUND OR s.expires_at<=clock_timestamp() THEN RETURN jsonb_build_object('error','closed'); END IF;
  IF s.require_location AND NOT p_checked THEN RETURN jsonb_build_object('error','location'); END IF;
  IF NOT EXISTS (SELECT 1 FROM asistencia_students WHERE id=p_student) THEN RETURN jsonb_build_object('error','student'); END IF;
  -- Reintento tras perder la respuesta: el mismo estudiante/dispositivo recibe su confirmación original.
  SELECT * INTO r FROM asistencia_records WHERE session_id=s.id AND device_id=p_device AND student_id=p_student;
  IF FOUND THEN RETURN jsonb_build_object('record',to_jsonb(r),'already',true); END IF;
  IF EXISTS (SELECT 1 FROM asistencia_records WHERE session_id=s.id AND device_id=p_device) THEN
    RETURN jsonb_build_object('error','device');
  END IF;
  IF EXISTS (SELECT 1 FROM asistencia_records WHERE session_id=s.id AND student_id=p_student) THEN
    RETURN jsonb_build_object('error','duplicate');
  END IF;
  INSERT INTO asistencia_records(session_id,student_id,device_id,location_checked)
    VALUES(s.id,p_student,p_device,s.require_location AND p_checked) RETURNING * INTO r;
  RETURN jsonb_build_object('record',to_jsonb(r),'already',false);
END $$;

-- NOMINA: solo número interno y nombre; no incluye los RUT del archivo original.

INSERT INTO asistencia_students (id,name) VALUES
(1, 'Alarcón Rosenblatt, Vicente Andrés'),
(2, 'Alvarado Molina, Fany Estephanie'),
(3, 'Álvarez Ortega, Martín Andrei'),
(4, 'Aranda Alvarado, Nallely Krisna'),
(5, 'Aravena Vega, Benjamín Andrés'),
(6, 'Arévalo Quiroz, Camila Andrea'),
(7, 'Azócar González, Francisca Ignacia'),
(8, 'Barra Yáñez, Bryan Alexis'),
(9, 'Berríos Infantas, Anahi Belén'),
(10, 'Bravo Peñaloza, Catalina Ignacia'),
(11, 'Canelon Paredes, Paola Elizabeth'),
(12, 'Canessa Sepúlveda, Bruno Enrique'),
(13, 'Casas Palma, Javiera Alejandra'),
(14, 'Del Campo Gálvez, Eileen Ivette'),
(15, 'Duque Vargas, Rafael Alexander'),
(16, 'Durand Cabello, Sofía Isidora'),
(17, 'Escudero Reyes, Sergio Yuri'),
(18, 'Espinosa Soto, Thannya Millaray'),
(19, 'Espinoza Espíndola, Eniguer Millaray'),
(20, 'Fuentes Martínez, Amy Lilibel'),
(21, 'Garay Marambio, Conan'),
(22, 'Gómez Campusano, Amparo Sofía'),
(23, 'González González, Enio Fabián'),
(24, 'González Vidal, Nicolás Alberto'),
(25, 'Larach Berríos, Ignacio Yasser'),
(26, 'Mancilla Pérez, Catalina Paz'),
(27, 'Monje Maldonado, Camilo Mateo'),
(28, 'Morales Carreazo, José Francisco Guillermo'),
(29, 'Mora Pavez, Emilia Constanza'),
(30, 'Muñoz Parra, Catalina Tais'),
(31, 'Navarrete Espinoza, Danae Anaís'),
(32, 'Pezoa Riveros, Jorge Alberto'),
(33, 'Pino Castillo, Francisca Andrea'),
(34, 'Poblete Flores, Nicolás Azael Jary'),
(35, 'Rojas Apablaza, Martín Vicente'),
(36, 'Romero Esquivel, Camila Antonia'),
(37, 'Saavedra Villalobos, Gabriel Ignacio'),
(38, 'Sepúlveda Roa, Eric Alejandro'),
(39, 'Tapia Oyarzo, Benjamin Ignacio'),
(40, 'Toro Durán, Jesús Amaro'),
(41, 'Urrutia Bahamondes, Fernanda Urrutia'),
(42, 'Vera Bravo, Daniela Ignacia'),
(43, 'Vidal Sanhueza, Matías Ignacio'),
(44, 'Vilches Salazar, Lilian Judith'),
(45, 'Zuñiga Delgado, María Alejandra')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
COMMIT;
