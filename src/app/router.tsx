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
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
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
const ProfilePage = lazy(() => import('../pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const UserDetailPage = lazy(() => import('../pages/admin/UserDetailPage').then((m) => ({ default: m.UserDetailPage })));
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
const PriceBasePage = lazy(() => import('../pages/catalog/PriceBasePage').then((m) => ({ default: m.PriceBasePage })));
const ProductDetailPage = lazy(() => import('../pages/catalog/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ServiceDetailPage = lazy(() => import('../pages/catalog/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })));
const ReferenceDataPage = lazy(() => import('../pages/reference/ReferenceDataPage').then((m) => ({ default: m.ReferenceDataPage })));

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
      // §D forced first-login change — a full-screen branded route OUTSIDE the app
      // shell (no nav to escape to). The guard routes temp-password sessions here.
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          // Own profile — any authenticated user (self-scoped; no permission gate).
          { path: 'profile', element: <ProfilePage /> },
          // UX-only guards — the backend enforces every permission per request.
          {
            element: <PermissionRoute permission="registration.review" />,
            children: [{ path: 'admin/registration-requests', element: <RegistrationRequestsPage /> }],
          },
          {
            element: <PermissionRoute permission="users.view" />,
            children: [
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'admin/users/:id', element: <UserDetailPage /> },
            ],
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
          // Phase 11B — price base (products/services) + reference data. View is
          // catalog.view (ADMIN/RAHBAR/SIFAT); the pages hide manage actions unless
          // the server-provided catalog.manage permission is present.
          {
            element: <PermissionRoute permission="catalog.view" />,
            children: [
              { path: 'catalog', element: <Navigate to="/app/catalog/products" replace /> },
              { path: 'catalog/products', element: <PriceBasePage /> },
              { path: 'catalog/services', element: <PriceBasePage /> },
              { path: 'catalog/products/:id', element: <ProductDetailPage /> },
              { path: 'catalog/services/:id', element: <ServiceDetailPage /> },
              { path: 'reference', element: <ReferenceDataPage /> },
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
