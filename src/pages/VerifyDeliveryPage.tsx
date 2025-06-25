import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Key, User as UserIcon } from 'lucide-react';
import emailjs from '@emailjs/browser';

// Environment variables for EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;


// Helper function to extract username from email
function extractUsername(email: string | null | undefined): string {
  if (!email) return 'User';
  return email.split('@')[0];
}

const VerifyDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation hook
  const { user, userData, loading } = useAuth();
  const [deliveryIdInput, setDeliveryIdInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !userData)) {
      navigate('/login');
      toast.info('Please log in to access this page.');
      return;
    }
    if (!loading && userData?.role !== 'delivery') {
      navigate('/account');
      toast.warn('This page is for delivery personnel only.');
      return;
    }
    if (!loading && userData?.isDeliveryInfoComplete) {
      navigate('/delivery-dashboard');
      toast.info('Your delivery account is already verified.');
      return;
    }

    // Check if deliveryId and mtp are passed via navigation state
    const { deliveryId, mtp } = location.state || {};
    if (deliveryId && mtp) {
      setDeliveryIdInput(deliveryId);
      setOtpInput(mtp);
      setShowVerificationForm(true);

      // Send MTP via EmailJS
      if (user?.email && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        const templateParams = {
          to_email: user.email,
          delivery_id: deliveryId,
          mtp: mtp,
          user_name: extractUsername(user.email),
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
          .then((response) => {
            console.log('EmailJS success!', response.status, response.text);
            toast.success('MTP sent to your registered email!');
          }, (err) => {
            console.error('EmailJS failed...', err);
            toast.error('Failed to send MTP email. Please check your network.');
          });
      } else {
        toast.warn('EmailJS configuration missing or user email not available. MTP not sent.');
      }

      // Automatically attempt verification if data is passed
      handleVerifyDeliveryLogin(deliveryId, mtp);
    } else if (!loading && userData?.deliveryInfo?.companyId) {
      // If delivery ID exists in userData, show verification form for manual input
      setShowVerificationForm(true);
    }
  }, [user, userData, loading, navigate, location.state]);

  const handleVerifyDeliveryLogin = async (idFromState?: string, mtpFromState?: string) => {
    if (!user?.uid) {
      toast.error('User not authenticated.');
      return;
    }

    const currentDeliveryId = idFromState || deliveryIdInput;
    const currentOtp = mtpFromState || otpInput;

    if (!currentDeliveryId || !currentOtp) {
      toast.warn('Please enter both Delivery ID and OTP.');
      return;
    }

    setIsLoading(true);
    setMessage('Verifying delivery credentials...');

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
      const storedDeliveryId = currentUserData?.deliveryInfo?.companyId;
      const storedMtp = currentUserData?.deliveryInfo?.mtp;

      if (storedDeliveryId === currentDeliveryId && storedMtp === currentOtp) {
        await updateDoc(userDocRef, {
          isDeliveryInfoComplete: true,
          'deliveryInfo.mtp': null, // Clear MTP after successful login verification
        });
        setMessage('Delivery credentials verified successfully! Redirecting...');
        toast.success('Delivery login successful!');
        navigate('/account'); // Redirect to /account page
      } else {
        setMessage('Invalid Delivery ID or OTP. Please try again.');
        toast.error('Invalid credentials.');
      }
    } catch (error: any) {
      console.error('Error verifying delivery credentials:', error);
      setMessage(`An error occurred: ${error.message}. Please try again.`);
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user || !userData || userData.role !== 'delivery' || userData.isDeliveryInfoComplete) {
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
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Delivery Login</h2>
        <p className="text-gray-600 text-center mb-8">Enter your Delivery ID and OTP to access your dashboard.</p>

        {/* Verification Form */}
        {showVerificationForm && (
          <div className="space-y-6">
            {/* Delivery ID Input */}
            <div>
              <label htmlFor="deliveryId" className="sr-only">Delivery ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="text-gray-400" size={20} />
                </div>
                <input
                  id="deliveryId"
                  name="deliveryId"
                  type="text"
                  required
                  value={deliveryIdInput}
                  onChange={(e) => setDeliveryIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-green-300 focus:border-green-500 text-lg transition-all duration-200"
                  placeholder="Delivery ID (e.g., PGD-ABC123DEF45)"
                  disabled={isLoading} // Disable input while loading
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
                  disabled={isLoading} // Disable input while loading
                />
              </div>
            </div>

            {message && <p className="text-center text-red-500 text-sm mt-2">{message}</p>}

            <button
              onClick={() => handleVerifyDeliveryLogin()} // Call without arguments for manual trigger
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-xl font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Sign In as Delivery'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyDeliveryPage;
