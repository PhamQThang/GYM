import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider';
import { useAuth } from './features/auth/auth-context';
import { AccountStatusPage, AuthCallbackPage, ForgotPasswordPage, InvitePage, LoginPage, ResetPasswordPage } from './features/auth/pages';
import { InvitationPanel } from './features/auth/pages/InvitationPanel';
import { ClientOverviewPanel } from './features/client/ClientOverviewPanel';
import { ClientWorkoutPage } from './features/client/ClientWorkoutPage';
import { ClientHistoryPage, ClientNutritionPage, ClientProgressPage } from './features/client/ClientTrackerPages';
import { RoleDashboard } from './components/RoleDashboard';
import { TrainerOverview } from './features/dashboard/TrainerOverview';
import { Card } from './components/ui/Card';
import { ROUTES, WORKOUT_TABS } from './lib/navigation';
import type { WorkoutTabId } from './lib/types';

function AccountRoute({ area }: { area?: 'pt' | 'client' | 'account' }) {
  const { state } = useAuth();
  if (state.status === 'signedOut') return <Navigate replace to="/login" />;
  if (state.status === 'recovery') return <Navigate replace to="/reset-password" />;
  if (state.status === 'ready' && state.profile && state.session && area !== 'account') {
    if (area !== state.profile.role) return <Navigate replace to={'/' + state.profile.role} />;
    return <RoleDashboard key={state.profile.id} profile={state.profile} />;
  }
  return <AccountStatusPage />;
}

function TrainerArea({ invitations = false }: { invitations?: boolean }) {
  const { state } = useAuth();
  if (!state.session) return null;
  const ownerId = state.session.user.id;
  if (!invitations) return <TrainerOverview key={ownerId} ownerId={ownerId} />;
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Học viên</h1>
    <Card><InvitationPanel key={ownerId} ownerId={ownerId} /></Card>
  </div>;
}

function ClientArea({ view }: { view: 'overview' | 'history' | 'progress' | 'nutrition' }) {
  const { state } = useAuth();
  if (!state.session || !state.clientId) return null;
  const scope = { userId: state.session.user.id, clientId: state.clientId };
  const key = scope.userId + ':' + scope.clientId + ':' + view;
  if (view === 'history') return <ClientHistoryPage key={key} {...scope} />;
  if (view === 'progress') return <ClientProgressPage key={key} {...scope} />;
  if (view === 'nutrition') return <ClientNutritionPage key={key} {...scope} />;
  return <ClientOverviewPanel key={key} {...scope} />;
}

function ClientWorkoutRoute({ tab }: { tab: WorkoutTabId }) {
  const { state } = useAuth();
  if (!state.session || !state.clientId) return null;
  return <ClientWorkoutPage key={state.session.user.id + ':' + state.clientId}
    userId={state.session.user.id} clientId={state.clientId} tab={tab} />;
}

function LegacyTrackerRoute({ path }: { path: string }) {
  const { state } = useAuth();
  const { search, hash } = useLocation();
  if (state.status !== 'ready' || state.profile?.role !== 'client') return <AccountRoute />;
  return <Navigate replace to={{ pathname: path, search, hash }} />;
}

export function CloudRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/invite" element={<InvitePage />} />
    <Route path="/account" element={<AccountRoute area="account" />} />
    <Route path="/pt" element={<AccountRoute area="pt" />}>
      <Route index element={<TrainerArea />} />
      <Route path="clients" element={<TrainerArea invitations />} />
    </Route>
    <Route path="/client" element={<AccountRoute area="client" />}>
      <Route index element={<ClientArea view="overview" />} />
      {WORKOUT_TABS.map(({ id, path }) =>
        <Route key={id} path={path.slice(1)} element={<ClientWorkoutRoute tab={id} />} />)}
      <Route path="history" element={<ClientArea view="history" />} />
      <Route path="progress" element={<ClientArea view="progress" />} />
      <Route path="nutrition" element={<ClientArea view="nutrition" />} />
    </Route>
    {[...WORKOUT_TABS.map(tab => tab.path), ROUTES.history, ROUTES.progress, ROUTES.nutrition].map(path =>
      <Route key={path} path={path} element={<LegacyTrackerRoute path={'/client' + path} />} />)}
    <Route path={ROUTES.settings} element={<LegacyTrackerRoute path="/account" />} />
    <Route path="*" element={<AccountRoute />} />
  </Routes>;
}

export default function CloudApp() {
  return <AuthProvider enabled><CloudRoutes /></AuthProvider>;
}
