import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary';
import { can } from '../../lib/permissions';
import type { Permission } from '../../types/auth';

/**
 * These guards are UX/navigation only. Real authorization is enforced by the
 * backend on every request — a user who bypasses these guards still cannot
 * read or mutate anything the server does not allow.
 */

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // §D — a temporary-password session must change the password before reaching any
  // app screen. The server enforces this too; here we just keep the UI consistent.
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  // A user who no longer needs the change should never sit on the forced screen.
  if (!user.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<FullScreenLoader />}>
        <Outlet />
      </Suspense>
    </RouteErrorBoundary>
  );
}

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user } = useAuth();

  if (!can(user, permission)) return <Navigate to="/app" replace />;
  return <Outlet />;
}
