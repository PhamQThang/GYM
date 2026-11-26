import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider';
import { useAuth } from './features/auth/auth-context';
import { AccountStatusPage, AuthCallbackPage, ForgotPasswordPage, InvitePage, LoginPage, ResetPasswordPage } from './features/auth/pages';
import { InvitationPanel } from './features/auth/pages/InvitationPanel';
import { ClientOverviewPanel } from './features/client/ClientOverviewPanel';
import { ClientHistoryPage, ClientNutritionPage, ClientProgressPage } from './features/client/ClientTrackerPages';
import { RoleDashboard } from './components/RoleDashboard';
import { TrainerOverview } from './features/dashboard/TrainerOverview';
import { Card } from './components/ui/Card';

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

function ClientArea({ view }: { view: 'overview' | 'workout' | 'history' | 'progress' | 'nutrition' }) {
  const { state } = useAuth();
  if (!state.session || !state.clientId) return null;
  const scope = { userId: state.session.user.id, clientId: state.clientId };
  const key = scope.userId + ':' + scope.clientId + ':' + view;
  if (view === 'history') return <ClientHistoryPage key={key} {...scope} />;
  if (view === 'progress') return <ClientProgressPage key={key} {...scope} />;
  if (view === 'nutrition') return <ClientNutritionPage key={key} {...scope} />;
  return <ClientOverviewPanel key={key} {...scope} view={view} />;
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
      <Route path="workout" element={<ClientArea view="workout" />} />
      <Route path="history" element={<ClientArea view="history" />} />
      <Route path="progress" element={<ClientArea view="progress" />} />
      <Route path="nutrition" element={<ClientArea view="nutrition" />} />
    </Route>
    <Route path="*" element={<AccountRoute />} />
  </Routes>;
}

export default function CloudApp() {
  return <AuthProvider enabled><CloudRoutes /></AuthProvider>;
}
