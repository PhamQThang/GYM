import process from 'node:process';
import { URL } from 'node:url';
import console from 'node:console';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Supply credentials from the disposable local stack through environment variables.
const url = new URL(process.env.GYM_LOCAL_URL);
assert.equal(url.origin, 'http://127.0.0.1:54321');
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const admin = createClient(url.href, process.env.GYM_LOCAL_SERVICE_KEY, options);
const makeClient = () => createClient(url.href, process.env.GYM_LOCAL_ANON_KEY, options);
const users = [];
const clientIds = [];
function unwrap(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
async function account(label) {
  const email = label + '-' + randomUUID() + '@example.test';
  const password = randomUUID();
  const user = unwrap(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user;
  users.push(user.id);
  const api = makeClient();
  unwrap(await api.auth.signInWithPassword({ email, password }));
  return { id: user.id, email, api };
}
try {
  const pt = await account('pt');
  const learner = await account('learner');
  const other = await account('other');
  unwrap(await admin.from('profiles').update({ role: 'pt' }).eq('id', pt.id));
  async function createClientProfile(email) {
    const id = unwrap(await pt.api.from('clients').insert({
      pt_id: pt.id, full_name: 'Local smoke fixture', email,
    }).select('id').single()).id;
    clientIds.push(id);
    return id;
  }
  const clientId = await createClientProfile(learner.email);
  const otherClientId = await createClientProfile(other.email);
  const otherInvite = unwrap(await pt.api.rpc('issue_client_invitation', { p_client_id: otherClientId }).single());
  assert.equal(unwrap(await other.api.rpc('accept_client_invitation', { p_token: otherInvite.token })), otherClientId);
  const issue = () => pt.api.rpc('issue_client_invitation', { p_client_id: clientId }).single();
  const first = unwrap(await issue());
  unwrap(await pt.api.rpc('revoke_client_invitation', { p_invitation_id: first.invitation_id }));
  const accept = token => learner.api.rpc('accept_client_invitation', { p_token: token });
  assert.ok((await accept(first.token)).error);
  const next = unwrap(await issue());
  const stranger = await account('stranger');
  assert.ok((await stranger.api.rpc('accept_client_invitation', { p_token: next.token })).error);
  assert.equal(unwrap(await accept(next.token)), clientId);
  assert.ok((await accept(next.token)).error);
  assert.deepEqual(unwrap(await learner.api.from('clients').select('id')), [{ id: clientId }]);

  unwrap(await learner.api.auth.signOut());
  assert.equal(unwrap(await learner.api.auth.getSession()).session, null);
  console.log('Local invitation and profile isolation passed.');
} finally {
  if (clientIds.length) {
    unwrap(await admin.from('client_invitations').delete().in('client_id', clientIds));
    unwrap(await admin.from('clients').delete().in('id', clientIds));
  }
  for (const id of users.reverse()) unwrap(await admin.auth.admin.deleteUser(id));
}
