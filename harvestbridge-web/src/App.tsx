import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then((module) => ({ default: module.UnauthorizedPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })));
const UserDetailsPage = lazy(() => import('./pages/UserDetailsPage').then((module) => ({ default: module.UserDetailsPage })));
const StoresPage = lazy(() => import('./pages/StoresPage').then((module) => ({ default: module.StoresPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage').then((module) => ({ default: module.StoriesPage })));
const DonationsPage = lazy(() => import('./pages/DonationsPage').then((module) => ({ default: module.DonationsPage })));
const CompostPage = lazy(() => import('./pages/CompostPage').then((module) => ({ default: module.CompostPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function PageLoader() {
  return (
    <div className="p-6">
      <LoadingSkeleton rows={8} />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailsPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/compost" element={<CompostPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
