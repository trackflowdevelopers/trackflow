import { NavLink } from 'react-router-dom';
import { Users, LayoutDashboard, LogOut, Building2, Car, Route } from 'lucide-react';
import { useAuth } from '@/modules/auth/context/useAuth';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#1A56DB]/15 text-[#4F83F1]'
            : 'text-[#8ba3c0] hover:bg-[#1A2942] hover:text-white'
        }`
      }
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#0F1C30] border-r border-[#1E3150]">
      <div className="px-5 py-5 border-b border-[#1E3150]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A56DB] flex items-center justify-center">
            <span className="text-white text-xs font-bold">TF</span>
          </div>
          <span className="text-white font-semibold text-sm">TrackFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a6080]">
          Main
        </p>
        <NavItem
          to="/dashboard"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
        />
        <NavItem
          to="/companies"
          icon={<Building2 size={18} />}
          label="Companies"
        />
        <NavItem
          to="/users"
          icon={<Users size={18} />}
          label="Users"
        />
        <NavItem
          to="/vehicles"
          icon={<Car size={18} />}
          label="Vehicles"
        />
        <NavItem
          to="/routes"
          icon={<Route size={18} />}
          label="Route History"
        />
      </nav>

      <div className="px-3 py-4 border-t border-[#1E3150]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8ba3c0] hover:bg-[#1A2942] hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
