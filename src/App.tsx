import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import TenantDashboard from './components/TenantDashboard';
import LandlordDashboard from './components/LandlordDashboard';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  return profile.role === 'landlord' ? <LandlordDashboard /> : <TenantDashboard />;
}

export default App;
