import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import StoreSelector from "../components/StoreSelector";

function NavItem({ to, label, icon, onNavigate }: { to: string; label: string; icon?: string; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg no-underline text-sm transition-all duration-200 ${
        active
          ? "text-blue-600 bg-blue-50 font-semibold"
          : "text-gray-700 hover:bg-gray-100 font-medium"
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, logout, isStoreWorker, isOrgAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            {user?.organization.logo_url ? (
              <div className="flex items-center space-x-3">
                <img
                  src={user.organization.logo_url}
                  alt={user.organization.name}
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {user.organization.name}
                  </h1>
                  <p className="text-xs text-gray-600 mt-0.5">HisaabKitaab</p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">HisaabKitaab</h1>
                <p className="text-xs text-gray-600 mt-1">Inventory & Billing</p>
              </>
            )}
          </div>

          {/* Store Selector - Only for Org Admins */}
          {isOrgAdmin && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Current Store
              </div>
              <StoreSelector />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem to="/dashboard" label="Dashboard" icon="📊" onNavigate={() => setSidebarOpen(false)} />
            {isOrgAdmin && (
              <>
                <NavItem to="/stores" label="Stores" icon="🏪" onNavigate={() => setSidebarOpen(false)} />
                <NavItem to="/users" label="Users" icon="👤" onNavigate={() => setSidebarOpen(false)} />
              </>
            )}
            <NavItem to="/products" label="Products" icon="📦" onNavigate={() => setSidebarOpen(false)} />
            {!isStoreWorker && (
              <>
                <NavItem to="/vendors" label="Vendors" icon="🏢" onNavigate={() => setSidebarOpen(false)} />
                <NavItem to="/customers" label="Customers" icon="👥" onNavigate={() => setSidebarOpen(false)} />
                <NavItem to="/purchases" label="Purchases" icon="📥" onNavigate={() => setSidebarOpen(false)} />
              </>
            )}
            <NavItem to="/invoices" label="Invoices" icon="📄" onNavigate={() => setSidebarOpen(false)} />
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            {user && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
                {user.store && (
                  <div className="text-xs text-gray-500 mt-1">{user.store.name}</div>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full btn btn-sm text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center justify-end space-x-2 sm:space-x-4">
            {user?.organization.logo_url && (
              <img
                src={user.organization.logo_url}
                alt={user.organization.name}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain hidden sm:block"
              />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
