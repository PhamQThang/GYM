import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { readClientOverview } from './client-overview';

const scope = { userId: '10000000-0000-4000-8000-000000000001', clientId: '10000000-0000-4000-8000-000000000002' };

function fixture(rows: Record<string, unknown>) {
  const queries = new Map<string, { eq: ReturnType<typeof vi.fn>; abortSignal: ReturnType<typeof vi.fn> }>();
  const from = vi.fn((table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: rows[table] ?? null, error: null }),
    };
    queries.set(table, query);
    return query;
  });
  return { api: { from } as unknown as SupabaseClient<Database>, queries, from };
}

it('rejects legacy local IDs before requesting cloud data', async () => {
  const { api, from } = fixture({});
  await expect(readClientOverview(api, { ...scope, clientId: 'local-client' }, new AbortController().signal)).rejects.toThrow();
  expect(from).not.toHaveBeenCalled();
});

it('requires the linked client row before requesting any related records', async () => {
  const { api, from, queries } = fixture({});
  await expect(readClientOverview(api, scope, new AbortController().signal)).rejects.toThrow();
  expect(from).toHaveBeenCalledTimes(1);
  expect(queries.get('clients')?.eq).toHaveBeenCalledWith('user_id', scope.userId);
});

it('scopes each repository read and maps absent rows to empty values without replacing zero', async () => {
  const { api, queries } = fixture({
    clients: { id: scope.clientId, full_name: 'Test' },
    nutrition_profiles: { target_kcal: null, protein_g: 0, carbs_g: null, fat_g: null },
  });
  const { signal } = new AbortController();
  await expect(readClientOverview(api, scope, signal)).resolves.toEqual({
    name: 'Test', nutrition: { calories: null, protein: 0, carbs: null, fat: null },
    program: null, lastWorkoutAt: null, weight: null, packageName: null, nextSessionAt: null,
  });
  for (const [table, query] of queries) {
    expect(query.eq).toHaveBeenCalledWith(table === 'clients' ? 'id' : 'client_id', scope.clientId);
    expect(query.abortSignal).toHaveBeenCalledWith(signal);
  }
  expect(queries.size).toBe(7);
});
