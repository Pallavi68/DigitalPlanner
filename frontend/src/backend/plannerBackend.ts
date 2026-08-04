import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PlannerState } from '../types';
import { getSupabaseClient } from './client';
import { plannerCache } from './cache';
import {
  normalizeImportResult,
  normalizeLoadResult,
  normalizeSaveResult,
  RPC,
  type ImportPlannerResult,
  type RemotePlannerEnvelope,
  type SavePlannerInput,
  type SavePlannerResult,
} from './contracts';
import { asBackendError, BackendError } from './errors';

export class SupabasePlannerBackend {
  async load(): Promise<RemotePlannerEnvelope | null> {
    const client = getSupabaseClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new BackendError('not_authenticated', 'Sign in to load cloud planner data.');
    const { data, error } = await client.rpc(RPC.load);
    if (error) throw asBackendError(error, 'Could not load planner data.');
    let envelope: RemotePlannerEnvelope | null;
    try {
      envelope = normalizeLoadResult(data);
    } catch (error) {
      throw new BackendError('invalid_data', 'Supabase returned an invalid planner response.', { cause: error });
    }
    if (!envelope) return null;
    plannerCache.write(auth.user.id, { ...envelope, cachedAt: new Date().toISOString() });
    return envelope;
  }

  async save(input: SavePlannerInput): Promise<SavePlannerResult> {
    const client = getSupabaseClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new BackendError('not_authenticated', 'Sign in to save planner data.');
    plannerCache.writeUnsaved(auth.user.id, input.state);
    const { data, error } = await client.rpc(RPC.save, {
      payload: input.state,
      expected_edited_at: input.expectedRevision ?? null,
    });
    if (error) throw asBackendError(error, 'Could not save planner data.');
    let result: SavePlannerResult;
    try {
      result = normalizeSaveResult(data);
    } catch (error) {
      throw new BackendError('invalid_data', 'Supabase returned an invalid save response.', { cause: error });
    }
    plannerCache.write(auth.user.id, {
      state: input.state,
      revision: result.revision,
      updatedAt: result.updatedAt,
      cachedAt: new Date().toISOString(),
    });
    plannerCache.clearUnsaved(auth.user.id);
    return result;
  }

  async importLegacy(state: PlannerState, key: string): Promise<ImportPlannerResult> {
    const { data, error } = await getSupabaseClient().rpc(RPC.importLegacy, {
      payload: state,
      import_key: key,
    });
    if (error) throw asBackendError(error, 'Could not import existing planner data.');
    try {
      return normalizeImportResult(data);
    } catch (parseError) {
      throw new BackendError('invalid_data', 'Supabase returned an invalid import response.', { cause: parseError });
    }
  }

  subscribeInvalidation(userId: string, onInvalidate: () => void, onError?: (error: BackendError) => void): () => void {
    let channel: RealtimeChannel | null = getSupabaseClient()
      .channel(`planner-sync:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planner_profiles', filter: `owner_id=eq.${userId}` },
        () => onInvalidate(),
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(asBackendError(error, 'Live planner updates were interrupted.'));
        }
      });
    return () => {
      if (channel) void getSupabaseClient().removeChannel(channel);
      channel = null;
    };
  }
}

export const supabasePlannerBackend = new SupabasePlannerBackend();
