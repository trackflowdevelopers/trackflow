import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/context/AuthProvider';
import { useAuth } from '@/modules/auth/context/useAuth';
import { LoginPage } from '@/modules/auth/pages/login.page';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UsersPage } from '@/modules/users/pages/users.page';
import { CompaniesPage } from '@/modules/companies/pages/companies.page';
import { VehiclesPage } from '@/modules/vehicles/pages/vehicles.page';
import { VehicleDetailPage } from '@/modules/vehicles/pages/vehicle-detail.page';
import { RouteHistoryPage } from '@/modules/routes/pages/route-history.page';
import { CompanyFleetPage } from '@/modules/fleet/pages/company-fleet.page';

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#1A56DB', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/companies" replace />} />
        <Route path="/dashboard" element={<Navigate to="/companies" replace />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:id/fleet" element={<CompanyFleetPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/routes" element={<RouteHistoryPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <RootNavigator />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
