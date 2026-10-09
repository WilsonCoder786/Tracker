import { NavLink } from 'react-router-dom';
import {
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Settings,
  UserCircle2,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMockStore } from '../../context/MockStoreContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/duties', label: 'Duties', icon: ClipboardList },
  { to: '/live-tracking', label: 'Live Tracking', icon: MapPinned },
  { to: '/location-history', label: 'Location History', icon: History },
  { to: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
];

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { logout, admin } = useAuth();
  const { unreadCount } = useMockStore();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">TD</div>
        <div className="brand-text">
          <strong>TrackerDuty</strong>
          <span>Admin Console</span>
        </div>
      </div>

      <nav className="nav-list">
        {links.map(({ to, label, icon: Icon, end, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <Icon size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            {showBadge && unreadCount > 0 ? (
              <span className="nav-badge">{unreadCount}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="pill" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
          <UserCircle2 size={16} />
          {admin?.fullName}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
