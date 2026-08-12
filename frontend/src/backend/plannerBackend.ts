import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PlannerState } from '../types';
import { getSupabaseClient } from './client';
import { requireUser } from './auth';
import { plannerCache } from './cache';
import {
  normalizeImportResult,
  normalizeDocumentResult,
  normalizeLoadResult,
  normalizeSaveResult,
  RPC,
  type ImportPlannerResult,
  type RemotePlannerEnvelope,
  type SavePlannerInput,
  type SavePlannerResult,
} from './contracts';
import { asBackendError, BackendError } from './errors';
import { plannerStatesMatch } from './syncVerification';

export class SupabasePlannerBackend {
  async load(): Promise<RemotePlannerEnvelope | null> {
    const client = getSupabaseClient();
    const user = await requireUser();
    const { data, error } = await client.rpc(RPC.load);
    if (error) throw asBackendError(error, 'Could not load planner data.');
    let envelope: RemotePlannerEnvelope | null;
    try {
      envelope = normalizeDocumentResult(data);
    } catch (error) {
      throw new BackendError('invalid_data', 'Supabase returned an invalid planner response.', { cause: error });
    }
    if (!envelope) {
      const { data: legacyData, error: legacyError } = await client.rpc(RPC.loadLegacy);
      if (legacyError) throw asBackendError(legacyError, 'Could not load existing planner data.');
      const legacy = normalizeLoadResult(legacyData);
      if (!legacy) return null;
      try {
        const bootstrapped = await this.saveDocument(legacy.state, undefined);
        envelope = { state: legacy.state, revision: bootstrapped.revision, updatedAt: bootstrapped.updatedAt };
      } catch (bootstrapError) {
        if (!(bootstrapError instanceof BackendError) || bootstrapError.code !== 'conflict') throw bootstrapError;
        const { data: concurrentData, error: concurrentError } = await client.rpc(RPC.load);
        if (concurrentError) throw asBackendError(concurrentError, 'Could not load the concurrently created planner document.');
        envelope = normalizeDocumentResult(concurrentData);
        if (!envelope) throw bootstrapError;
      }
    }
    plannerCache.write(user.id, { ...envelope, cachedAt: new Date().toISOString() });
    return envelope;
  }

  private async saveDocument(state: PlannerState, expectedRevision?: number): Promise<SavePlannerResult> {
    const { data, error } = await getSupabaseClient().rpc(RPC.save, {
      payload: state,
      expected_revision: expectedRevision ?? null,
    });
    if (error) throw asBackendError(error, 'Could not save planner data.');
    return normalizeSaveResult(data);
  }

  async save(input: SavePlannerInput): Promise<SavePlannerResult> {
    const user = await requireUser();
    plannerCache.writeUnsaved(user.id, input.state);
    let result: SavePlannerResult;
    try {
      result = await this.saveDocument(input.state, input.expectedRevision);
      const verified = await this.load();
      if (!verified || verified.revision !== result.revision || !plannerStatesMatch(verified.state, input.state)) {
        throw new BackendError('remote', 'Supabase saved the request but read-back verification did not match. Your device copy is preserved for retry.', { retryable: true });
      }
    } catch (error) {
      if (error instanceof BackendError) throw error;
      throw new BackendError('invalid_data', 'Supabase returned an invalid save response.', { cause: error });
    }
    plannerCache.write(user.id, {
      state: input.state,
      revision: result.revision,
      updatedAt: result.updatedAt,
      cachedAt: new Date().toISOString(),
    });
    plannerCache.clearUnsaved(user.id);
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

  subscribeInvalidation(
    userId: string,
    onInvalidate: () => void,
    onError?: (error: BackendError) => void,
    onConnected?: () => void,
  ): () => void {
    let channel: RealtimeChannel | null = getSupabaseClient()
      .channel(`planner-sync:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planner_documents', filter: `owner_id=eq.${userId}` },
        () => onInvalidate(),
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') onConnected?.();
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
