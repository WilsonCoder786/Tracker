import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useMockStore } from '../../context/MockStoreContext';
import { useToast } from '../../context/ToastContext';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/staff': 'Staff',
  '/duties': 'Duties',
  '/live-tracking': 'Live Tracking',
  '/location-history': 'Location History',
  '/notifications': 'Notifications',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { push } = useToast();
  const { unreadCount, refresh, lastRefreshedAt } = useMockStore();
  const title = titles[location.pathname] ?? 'Admin';

  useEffect(() => {
    const id = window.setInterval(() => refresh(), 30000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <div className="app-shell">
      {sidebarOpen ? (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <div className="topbar-subtitle">
                Updated {lastRefreshedAt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="pill">Live · Firebase</span>
            <Link to="/notifications" className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 ? <span className="badge-dot">{unreadCount}</span> : null}
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => {
                refresh();
                push('Data refreshed');
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
