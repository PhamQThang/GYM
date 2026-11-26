import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/database.types';
import { createInvitationService } from './invitation-service';

function clientFixture() {
  const chain = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const from = vi.fn().mockReturnValue(chain);
  const rpc = vi.fn();
  const service = createInvitationService({ from, rpc } as unknown as SupabaseClient<Database>);
  return { chain, from, rpc, service };
}
describe('PT invitation service', () => {
  it('selects only safe fields and scopes eligible clients and pending invitations to owner', async () => {
    const { chain, service } = clientFixture();
    await service.list('pt-test', new AbortController().signal);
    expect(chain.select.mock.calls).toEqual([['id,full_name,email'], ['id,client_id,expires_at']]);
    expect(chain.eq).toHaveBeenCalledWith('pt_id', 'pt-test');
    expect(chain.eq).toHaveBeenCalledWith('issued_by', 'pt-test');
    expect(chain.eq).toHaveBeenCalledWith('status', 'active');
    expect(chain.is).toHaveBeenCalledWith('user_id', null);
    expect(chain.is).toHaveBeenCalledWith('archived_at', null);
  });
  it('issues and revokes only through the validated RPC contract', async () => {
    const { rpc, service } = clientFixture();
    const issued = { invitation_id: 'invite-test', token: 'a'.repeat(64), expires_at: '2026-12-01T00:00:00Z' };
    rpc.mockResolvedValueOnce({ data: [issued], error: null });
    expect(await service.issue('client-test')).toEqual(issued);
    expect(rpc).toHaveBeenCalledWith('issue_client_invitation', { p_client_id: 'client-test' });
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await service.revoke('invite-test');
    expect(rpc).toHaveBeenCalledWith('revoke_client_invitation', { p_invitation_id: 'invite-test' });
  });
  it('does not surface backend details or malformed issued tokens', async () => {
    const { rpc, service } = clientFixture();
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'private record identifier' } });
    await expect(service.issue('client-test')).rejects.toThrow('Invitation issue failed');
    rpc.mockResolvedValueOnce({ data: [{ invitation_id: 'id', token: 'wrong', expires_at: 'invalid' }], error: null });
    await expect(service.issue('client-test')).rejects.toThrow('Invitation issue failed');
  });
});
