import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['PARTICIPANT', 'FACILITATOR', 'CLIENT_ADMIN', 'SYSTEM_ADMIN'] },
    { name: 'Projects', href: '/projects', roles: ['FACILITATOR', 'CLIENT_ADMIN', 'SYSTEM_ADMIN'] },
    { name: 'Assessments', href: '/assessments', roles: ['PARTICIPANT', 'FACILITATOR', 'SYSTEM_ADMIN'] },
    { name: 'Reports', href: '/reports', roles: ['FACILITATOR', 'CLIENT_ADMIN', 'SYSTEM_ADMIN'] },
    { name: 'Organizations', href: '/organizations', roles: ['SYSTEM_ADMIN'] },
  ].filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-400" />

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center">
                <span className="text-xl font-bold text-secondary-500">EMKEI</span>
                <span className="text-xl font-light text-primary-500 ml-1">Capacity</span>
              </Link>

              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      location.pathname.startsWith(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <div className="hidden sm:flex sm:items-center sm:space-x-4">
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="badge bg-primary-100 text-primary-700 capitalize">
                  {user?.role.toLowerCase().replace('_', ' ')}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost text-sm"
                >
                  Logout
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname.startsWith(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary-500 text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="font-bold">EMKEI INNOVATIONS</span>
            </div>
            <p className="text-sm text-secondary-200">
              Driving Africa's Biotech Breakthroughs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
