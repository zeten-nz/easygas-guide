/* eslint-disable react-refresh/only-export-components --
   Route table: the lazy route components are defined beside the router config.
   This module exports the router (not a component) and is not a fast-refresh
   boundary, so the fast-refresh rule does not apply here. */
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, PermissionRoute, ProtectedRoute } from '../features/auth/route-guards';
import { AppShell } from '../pages/app/AppShell';
// Eager: the first screens a user sees (guest login, authenticated home) and the
// shell/guards themselves — splitting these would only add a fetch to first paint.
import { LoginPage } from '../pages/auth/LoginPage';
import { HomePage } from '../pages/app/HomePage';
import { NotFoundPage } from '../pages/app/NotFoundPage';

/**
 * Phase 10E §K route code-splitting. Each non-critical route is a lazy chunk so
 * the initial bundle carries only the shell + first screens; heavy admin,
 * quality/template, and job-flow screens load on demand. The Suspense boundary
 * that renders <RouteFallback/> lives in AppShell (and GuestRoute); a failed
 * chunk fetch is caught by <RouteErrorBoundary/> there.
 */
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const RegistrationRequestsPage = lazy(() => import('../pages/admin/RegistrationRequestsPage').then((m) => ({ default: m.RegistrationRequestsPage })));
const UsersPage = lazy(() => import('../pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const BranchesPage = lazy(() => import('../pages/admin/BranchesPage').then((m) => ({ default: m.BranchesPage })));
const CustomersPage = lazy(() => import('../pages/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('../pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));
const VehiclesPage = lazy(() => import('../pages/vehicles/VehiclesPage').then((m) => ({ default: m.VehiclesPage })));
const JobsPage = lazy(() => import('../pages/jobs/JobsPage').then((m) => ({ default: m.JobsPage })));
const MyJobsPage = lazy(() => import('../pages/jobs/MyJobsPage').then((m) => ({ default: m.MyJobsPage })));
const CreateJobPage = lazy(() => import('../pages/jobs/CreateJobPage').then((m) => ({ default: m.CreateJobPage })));
const JobDetailPage = lazy(() => import('../pages/jobs/JobDetailPage').then((m) => ({ default: m.JobDetailPage })));
const RiskPolicyPage = lazy(() => import('../pages/admin/RiskPolicyPage').then((m) => ({ default: m.RiskPolicyPage })));
const TemplatesPage = lazy(() => import('../pages/admin/templates/TemplatesPage').then((m) => ({ default: m.TemplatesPage })));
const TemplateDetailPage = lazy(() => import('../pages/admin/templates/TemplateDetailPage').then((m) => ({ default: m.TemplateDetailPage })));

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          // UX-only guards — the backend enforces every permission per request.
          {
            element: <PermissionRoute permission="registration.review" />,
            children: [{ path: 'admin/registration-requests', element: <RegistrationRequestsPage /> }],
          },
          {
            element: <PermissionRoute permission="users.view" />,
            children: [{ path: 'admin/users', element: <UsersPage /> }],
          },
          {
            element: <PermissionRoute permission="branches.manage" />,
            children: [{ path: 'admin/branches', element: <BranchesPage /> }],
          },
          {
            element: <PermissionRoute permission="customers.view" />,
            children: [
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="vehicles.view" />,
            children: [{ path: 'vehicles', element: <VehiclesPage /> }],
          },
          {
            element: <PermissionRoute permission="jobs.view" />,
            children: [
              { path: 'jobs', element: <JobsPage /> },
              { path: 'my-jobs', element: <MyJobsPage /> },
              { path: 'jobs/:id', element: <JobDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="risk.matrix.approve" />,
            children: [{ path: 'admin/risk-policy', element: <RiskPolicyPage /> }],
          },
          {
            element: <PermissionRoute permission="jobs.create" />,
            children: [{ path: 'jobs/new', element: <CreateJobPage /> }],
          },
          {
            element: <PermissionRoute permission="templates.manage" />,
            children: [
              { path: 'admin/templates', element: <TemplatesPage /> },
              { path: 'admin/templates/:id', element: <TemplateDetailPage /> },
            ],
          },
          // Unknown /app/* path → branded 404 (not a silent redirect).
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/app" replace /> },
]);
