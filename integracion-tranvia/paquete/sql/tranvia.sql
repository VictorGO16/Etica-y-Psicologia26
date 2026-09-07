-- Ejecutar una sola vez en el editor SQL de Neon.
-- No modifica ninguna tabla externa a este juego.
CREATE TABLE IF NOT EXISTS tranvia_generaciones (
  generation text PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS tranvia_control (
  id smallint PRIMARY KEY CHECK (id = 1),
  generation text NOT NULL REFERENCES tranvia_generaciones(generation)
);
CREATE TABLE IF NOT EXISTS tranvia_respuestas (
  id text PRIMARY KEY,
  generation text NOT NULL REFERENCES tranvia_generaciones(generation) ON DELETE CASCADE,
  session_id text NOT NULL,
  scene smallint NOT NULL CHECK (scene BETWEEN 1 AND 4),
  choice text NOT NULL CHECK (choice IN ('none', 'left', 'right')),
  destination text NOT NULL CHECK (destination IN ('left', 'right')),
  result text NOT NULL,
  name text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (generation, session_id, scene)
);
CREATE INDEX IF NOT EXISTS tranvia_respuestas_orden ON tranvia_respuestas(generation, created_at);
INSERT INTO tranvia_generaciones (generation)
VALUES ('inicio') ON CONFLICT DO NOTHING;
INSERT INTO tranvia_control (id, generation)
VALUES (1, 'inicio') ON CONFLICT (id) DO NOTHING;
