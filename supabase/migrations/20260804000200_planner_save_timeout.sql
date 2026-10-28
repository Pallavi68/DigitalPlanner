begin;

-- Supabase's authenticated REST role defaults to an 8-second statement
-- timeout. This single-owner aggregate save can legitimately exceed that for
-- a well-populated planner, so scope a bounded exemption to this RPC only.
alter function public.save_planner_state(jsonb, bigint)
  set statement_timeout to '30s';

commit;
