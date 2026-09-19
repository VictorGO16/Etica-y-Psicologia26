CREATE TABLE IF NOT EXISTS practica_runs (
  id text PRIMARY KEY,
  participant_id text NOT NULL,
  test_id text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  abandoned_at timestamptz,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS practica_runs_participant_idx
  ON practica_runs (participant_id, test_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS practica_runs_test_idx
  ON practica_runs (test_id, updated_at DESC);
