import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const DeliveryLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Removed userData and updateUserProfile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [isLoggedInLocally, setIsLoggedInLocally] = useState(false); // New local state for login status

  // Obfuscated credentials (Base64 encoded)
  const ENCODED_ADMIN_EMAIL = 'ZGVsaXZlcnlAcGhhcm1hZ28udmVyY2VsLmFwcA==';
  const ENCODED_ADMIN_PASSWORD = 'UEdEQy1hZG1pbjEyMDkvJiY=';

  // Helper function to decode Base64
  const decodeBase64 = (str: string) => atob(str);

  const handleLogin = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated. Please log in first.');
      return;
    }

    // Decode credentials
    const ADMIN_EMAIL = decodeBase64(ENCODED_ADMIN_EMAIL);
    const ADMIN_PASSWORD = decodeBase64(ENCODED_ADMIN_PASSWORD);

    if (!email || !password) {
      toast.warn('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsLoggedInLocally(true); // Set local login status
        toast.success('Delivery Admin login successful! Redirecting to orders...');
        navigate('/delivery-orders');
      } else {
        toast.error('Invalid email or password.');
      }
    } catch (error: any) {
      console.error('Error during delivery admin login:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // No redirect based on persistent state, always show form unless loading

  // Show loading spinner if auth context is still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-4 border-blue-500 border-opacity-50 animate-spin-slow"></div>
          <div className="absolute w-20 h-20 rounded-full border-4 border-t-4 border-purple-500 border-opacity-50 animate-spin-slow" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-t-4 border-green-500 border-opacity-50 animate-spin-slow" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <div className="flex justify-center mb-6">
           <Lock size={48} className="text-indigo-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Delivery Admin Login</h2>
        <p className="text-gray-600 text-center mb-8">Enter credentials to access delivery orders.</p>

        <div className="space-y-6">
           {/* Email Input */}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-gray-400" size={20} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-500 text-lg transition-all duration-200"
                placeholder="Email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={20} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} // Toggle type based on state
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-500 text-lg transition-all duration-200"
                placeholder="Password"
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)} // Toggle visibility
              >
                {showPassword ? (
                  <EyeOff className="text-gray-400" size={20} />
                ) : (
                  <Eye className="text-gray-400" size={20} />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? 'Logging In...' : 'Login as Delivery Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLoginPage;
