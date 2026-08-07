begin;

-- A planner with several weeks of daily snapshots can exceed the earlier
-- 30-second ceiling because this RPC rewrites the normalized owner aggregate.
-- Keep the exemption scoped to this authenticated planner function.
alter function public.save_planner_state(jsonb, bigint)
  set statement_timeout to '120s';

commit;
