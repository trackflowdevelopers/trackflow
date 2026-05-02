import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/modules/auth/context/AuthProvider';
import { useAuth } from '@/modules/auth/context/useAuth';
import { LoginPage } from '@/modules/auth/pages/login.page';

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#8ba3c0' }}>
      Dashboard — tez kunda
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
