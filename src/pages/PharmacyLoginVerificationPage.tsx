import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Key, User as UserIcon } from 'lucide-react';

const PharmacyLoginVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [pharmacyIdInput, setPharmacyIdInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && (!user || !userData)) {
      // If not logged in, redirect to login page
      navigate('/login');
      toast.info('Please log in to access this page.');
      return;
    }
    if (!loading && userData?.role !== 'pharmacy') {
      // If not a pharmacy, redirect to account page or home
      navigate('/account');
      toast.warn('This page is for pharmacies only.');
      return;
    }
    if (!loading && userData?.isPharmacyVerified) {
      // If already verified, redirect to dashboard
      navigate('/dashboard/pharmacy');
      toast.info('Your pharmacy account is already verified.');
      return;
    }
  }, [user, userData, loading, navigate]);

  const handleVerifyPharmacyLogin = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated.');
      return;
    }
    if (!pharmacyIdInput || !otpInput) {
      toast.warn('Please enter both Pharmacy ID and OTP.');
      return;
    }

    setIsLoading(true);
    setMessage('Verifying pharmacy credentials...');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setMessage('User document not found.');
        toast.error('User data missing.');
        setIsLoading(false);
        return;
      }

      const currentUserData = userDocSnap.data();
      const storedPharmacyId = currentUserData?.pharmacyInfo?.pharmacyId;
      const storedMtp = currentUserData?.pharmacyInfo?.mtp; // Get MTP from pharmacyInfo

      if (storedPharmacyId === pharmacyIdInput && storedMtp === otpInput) { // Compare with MTP
        await updateDoc(userDocRef, {
          isPharmacyVerified: true,
          'pharmacyInfo.mtp': null, // Clear MTP after successful login verification
        });
        setMessage('Pharmacy credentials verified successfully! Redirecting...');
        toast.success('Pharmacy login successful!');
        navigate('/account'); // Redirect to account page
      } else {
        setMessage('Invalid Pharmacy ID or MTP. Please try again.'); // Update message
        toast.error('Invalid credentials.');
      }
    } catch (error: any) {
      console.error('Error verifying pharmacy credentials:', error);
      setMessage(`An error occurred: ${error.message}. Please try again.`);
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user || !userData || userData.role !== 'pharmacy' || userData.isPharmacyVerified) {
    // Render loading or nothing if conditions for this page are not met yet
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <div className="flex justify-center mb-6">
           <Key size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Pharmacy Login</h2>
        <p className="text-gray-600 text-center mb-8">Enter your Pharmacy ID and OTP to access your dashboard.</p>

        <div className="space-y-6">
           {/* Pharmacy ID Input */}
          <div>
            <label htmlFor="pharmacyId" className="sr-only">Pharmacy ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="text-gray-400" size={20} />
              </div>
              <input
                id="pharmacyId"
                name="pharmacyId"
                type="text"
                required
                value={pharmacyIdInput}
                onChange={(e) => setPharmacyIdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-green-300 focus:border-green-500 text-lg transition-all duration-200"
                placeholder="Pharmacy ID (e.g., PGP-ABC123DEF45)"
              />
            </div>
          </div>

          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="sr-only">OTP</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="text-gray-400" size={20} />
              </div>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-green-300 focus:border-green-500 text-lg transition-all duration-200"
                placeholder="6-digit OTP"
                maxLength={6}
              />
            </div>
          </div>

          {message && <p className="text-center text-red-500 text-sm mt-2">{message}</p>}

          <button
            onClick={handleVerifyPharmacyLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-xl font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Sign In as Pharmacy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyLoginVerificationPage;
