import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/database.types';

export type InviteCandidate = { id: string; full_name: string; email: string | null };
export type PendingInvitation = { id: string; client_id: string; expires_at: string };
export type IssuedInvitation = { invitation_id: string; token: string; expires_at: string };

export function createInvitationService(client: SupabaseClient<Database>) {
  return {
    async createClient(ownerId: string, name: string, email: string) {
      const { data, error } = await client.from('clients')
        .insert({ pt_id: ownerId, full_name: name.trim(), email: email.trim().toLowerCase() })
        .select('id,full_name,email').single();
      if (error?.code === '23505') throw new Error('duplicate-client-email');
      if (error || !data) throw new Error('Client creation failed');
      return data;
    },
    async list(ownerId: string, signal: AbortSignal) {
      const [clients, pending] = await Promise.all([
        client.from('clients').select('id,full_name,email').eq('pt_id', ownerId)
          .eq('status', 'active').is('user_id', null).is('archived_at', null).not('email', 'is', null)
          .order('full_name').abortSignal(signal),
        client.from('client_invitations').select('id,client_id,expires_at').eq('issued_by', ownerId)
          .is('accepted_at', null).is('revoked_at', null).abortSignal(signal),
      ]);
      if (clients.error || pending.error) throw new Error('Invitation data unavailable');
      return { clients: (clients.data ?? []).filter(row => row.email?.trim()), pending: pending.data ?? [] };
    },
    async issue(clientId: string) {
      const { data, error } = await client.rpc('issue_client_invitation', { p_client_id: clientId });
      const issued = data?.[0];
      if (error || !issued || !/^[0-9a-f]{64}$/.test(issued.token) || !Number.isFinite(Date.parse(issued.expires_at))) throw new Error('Invitation issue failed');
      return issued;
    },
    async revoke(invitationId: string) {
      const { error } = await client.rpc('revoke_client_invitation', { p_invitation_id: invitationId });
      if (error) throw new Error('Invitation revoke failed');
    },
  };
}

export async function loadInvitationService() {
  const { supabase } = await import('../../../lib/supabase');
  return createInvitationService(supabase);
}
