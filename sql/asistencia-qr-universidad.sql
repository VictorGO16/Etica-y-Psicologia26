-- Guarda una sola imagen y el modo de presentación. No modifica asistencias existentes.
BEGIN;
CREATE TABLE IF NOT EXISTS asistencia_university_qr (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  image_data text,
  mime_type text CHECK (mime_type IN ('image/png','image/jpeg','image/webp')),
  version uuid,
  CHECK ((image_data IS NULL) = (mime_type IS NULL)),
  CHECK (image_data IS NULL OR length(image_data) <= 1398104),
  CHECK (NOT enabled OR (image_data IS NOT NULL AND version IS NOT NULL))
);
INSERT INTO asistencia_university_qr (id) VALUES (true) ON CONFLICT DO NOTHING;
COMMIT;
