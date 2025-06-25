import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaHome } from 'react-icons/fa'; // Import FaHome icon
import { Lock, User as UserIcon, CheckCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [isFullNameValid, setIsFullNameValid] = useState(false);

  const validateFullName = (name: string) => {
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    const containsNumbers = /\d/.test(name); // Check if the name contains any numbers
    const allPartsValidLength = nameParts.every(part => part.length >= 3);
    const isValid = nameParts.length === 4 && allPartsValidLength && !containsNumbers;

    setIsFullNameValid(isValid);
    if (!name.trim()) {
      setFullNameError('Please enter your full name.');
    } else if (containsNumbers) {
      setFullNameError('Full name cannot contain numbers.');
    } else if (!allPartsValidLength) {
      setFullNameError('Each name must be 3 letters or more.');
    } else if (nameParts.length !== 4) {
      setFullNameError('Full name must consist of exactly 4 names.');
    } else {
      setFullNameError('');
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFullName(name);
    validateFullName(name);
  };

  const handleGoogleSignIn = () => {
    // Re-validate just before submission to catch any last-minute changes
    validateFullName(fullName);
    if (!isFullNameValid) {
      // If validation fails, the error message will be set by validateFullName
      return;
    }
    setFullNameError(''); // Clear any previous error
    signInWithGoogle(fullName); // Pass fullName to signInWithGoogle
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-4 border-blue-500 border-opacity-50 animate-spin-slow"></div>
          <div className="absolute w-20 h-20 rounded-full border-4 border-t-4 border-purple-500 border-opacity-50 animate-spin-slow" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-t-4 border-green-500 border-opacity-50 animate-spin-slow" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-gray-200 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 transition-all duration-200"
          title="Go to Home Page"
        >
          <FaHome size={24} />
        </button>
        <div className="flex justify-center mb-6">
           <Lock size={48} className="text-blue-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Register Account</h2>
        <p className="text-gray-600 text-center mb-8">Sign in to manage your health needs.</p>

        <div className="space-y-6">
           {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="sr-only">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="text-gray-400" size={20} />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={handleFullNameChange}
                className={`w-full pl-10 pr-4 py-3 border ${fullNameError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500 text-lg transition-all duration-200`}
                placeholder="Full Name"
              />
              {isFullNameValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              )}
            </div>
            {fullNameError && <p className="text-red-500 text-sm mt-2">{fullNameError}</p>}
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">And Continue With</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || !isFullNameValid}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-xl font-semibold text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <FcGoogle className="mr-4" size={28} />
            Sign in with Google
          </button>

          <p className="text-center text-gray-500 text-sm">
            By signing in, you agree to our <button onClick={() => navigate('/terms-of-service')} className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0">Terms of Service</button> and <button onClick={() => navigate('/privacy-policy')} className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
