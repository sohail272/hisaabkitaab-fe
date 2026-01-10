import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [organization, setOrganization] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    logo: null as File | null,
    logoPreview: '',
  });
  
  const [store, setStore] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
  });

  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrganization({
          ...organization,
          logo: file,
          logoPreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validation
    if (step === 1) {
      if (!organization.name.trim()) {
        setError('Organization name is required');
        setLoading(false);
        return;
      }
      setStep(2);
      setLoading(false);
      return;
    }

    if (step === 2) {
      if (!store.name.trim() || !store.code.trim()) {
        setError('Store name and code are required');
        setLoading(false);
        return;
      }
      setStep(3);
      setLoading(false);
      return;
    }

    if (step === 3) {
      if (!user.name.trim() || !user.email.trim() || !user.password) {
        setError('All user fields are required');
        setLoading(false);
        return;
      }

      if (user.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      if (user.password !== user.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Submit onboarding
      try {
        const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'https://hisaabkitaab-be.onrender.com/api/v1';
        const formData = new FormData();
        
        formData.append('organization[name]', organization.name);
        if (organization.phone) formData.append('organization[phone]', organization.phone);
        if (organization.email) formData.append('organization[email]', organization.email);
        if (organization.address) formData.append('organization[address]', organization.address);
        if (organization.logo) formData.append('organization[logo]', organization.logo);
        
        formData.append('store[name]', store.name);
        formData.append('store[code]', store.code.toUpperCase());
        if (store.address) formData.append('store[address]', store.address);
        if (store.phone) formData.append('store[phone]', store.phone);
        
        formData.append('user[name]', user.name);
        formData.append('user[email]', user.email);
        formData.append('user[password]', user.password);
        if (user.phone) formData.append('user[phone]', user.phone);

        const response = await fetch(`${BASE}/auth/onboard`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Onboarding failed');
        }

        const data = await response.json();
        
        // Auto-login with returned token
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Use login method to set auth state
        await login(user.email, user.password);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to HisaabKitaab</h1>
          <p className="text-gray-600 mb-8">Let's set up your organization</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Organization */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={organization.name}
                  onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                  placeholder="e.g., SMK Clothing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  className="input"
                />
                {organization.logoPreview && (
                  <div className="mt-2">
                    <img
                      src={organization.logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 object-contain border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={organization.phone}
                  onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                  placeholder="Organization phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  value={organization.email}
                  onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                  placeholder="Organization email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="input"
                  rows={3}
                  value={organization.address}
                  onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                  placeholder="Organization address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Store */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">First Branch/Store</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                  placeholder="e.g., SMK Clothing - Downtown Branch"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={store.code}
                  onChange={(e) => setStore({ ...store, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SMK-DT-001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Used in invoice numbers (e.g., SMK-DT-INV-001)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="input"
                  rows={3}
                  value={store.address}
                  onChange={(e) => setStore({ ...store, address: e.target.value })}
                  placeholder="Store address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={store.phone}
                  onChange={(e) => setStore({ ...store, phone: e.target.value })}
                  placeholder="Store phone"
                />
              </div>
            </div>
          )}

          {/* Step 3: Admin User */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Admin Account</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  placeholder="Your phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  value={user.confirmPassword}
                  onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setStep(step - 1);
                  setError('');
                }}
                disabled={loading}
              >
                Previous
              </button>
            )}
            <div className={step === 1 ? 'ml-auto' : ''}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : step === 3 ? 'Complete Setup' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

