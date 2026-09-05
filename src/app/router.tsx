import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, PermissionRoute, ProtectedRoute } from '../features/auth/route-guards';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { AppShell } from '../pages/app/AppShell';
import { HomePage } from '../pages/app/HomePage';
import { RegistrationRequestsPage } from '../pages/admin/RegistrationRequestsPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { BranchesPage } from '../pages/admin/BranchesPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';
import { VehiclesPage } from '../pages/vehicles/VehiclesPage';
import { JobsPage } from '../pages/jobs/JobsPage';
import { MyJobsPage } from '../pages/jobs/MyJobsPage';
import { CreateJobPage } from '../pages/jobs/CreateJobPage';
import { JobDetailPage } from '../pages/jobs/JobDetailPage';
import { RiskPolicyPage } from '../pages/admin/RiskPolicyPage';
import { TemplatesPage } from '../pages/admin/templates/TemplatesPage';
import { TemplateDetailPage } from '../pages/admin/templates/TemplateDetailPage';

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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/app" replace /> },
]);
