begin;

-- The aggregate document includes every dated planner surface. Keep the
-- timeout scoped to its authenticated save RPC so a fuller habit sheet cannot
-- fail merely because the default request window is too short.
alter function public.save_planner_document(jsonb, bigint)
  set statement_timeout to '30s';

commit;
