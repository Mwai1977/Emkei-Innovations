import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is handled in the store
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-400" />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-500">EMKEI</h1>
            <p className="text-primary-500 text-lg">Capacity Building Platform</p>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                  Register
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Demo Credentials:</p>
            <p>Admin: admin@emkei.co.ke / Admin123!</p>
            <p>Facilitator: facilitator@emkei.co.ke / Facilitator123!</p>
            <p>Participant: participant@sahpra.org.za / Participant123!</p>
          </div>
        </div>
      </div>

      {/* Footer gradient bar */}
      <div className="h-2 bg-gradient-to-r from-secondary-400 to-secondary-500" />
    </div>
  );
}
