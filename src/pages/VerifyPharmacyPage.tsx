import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const VerifyPharmacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, generatePharmacyCredentials, verifyPharmacy } = useAuth();
  const [pharmacyId, setPharmacyId] = useState('');
  const [mtpInput, setMtpInput] = useState<string[]>(Array(6).fill(''));
  const [message, setMessage] = useState('Please wait while we prepare your Pharmacy ID...');
  const [isLoading, setIsLoading] = useState(false);
  const [mtpSent, setMtpSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user) {
      toast.error('You need to be logged in to access this page.');
      navigate('/login');
      return;
    }

    if (userData?.role !== 'Pharmacy') {
      toast.warn('This page is for pharmacies only.');
      navigate('/account'); // Or appropriate redirect
      return;
    }

    if (userData?.isPharmacyVerified) {
      toast.info('Your pharmacy account is already verified.');
      navigate('/dashboard/pharmacy'); // Or appropriate redirect
      return;
    }

    // If pharmacyId already exists in userData, display it and indicate MTP needs to be entered
    if (userData?.pharmacyInfo?.pharmacyId) {
      setPharmacyId(userData.pharmacyInfo.pharmacyId);
      setMessage('Your Pharmacy ID is already generated. Please enter the MTP sent to your email.');
      setMtpSent(true); // Assume MTP was sent previously or needs to be re-sent
    } else {
      setMessage('Click the button below to generate your Pharmacy ID and send MTP to your email.');
    }
  }, [user, userData, navigate]);

  const handleMtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 1) return;

    const newMtpInput = [...mtpInput];
    newMtpInput[index] = value;
    setMtpInput(newMtpInput);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !mtpInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendMtp = async () => {
    if (!user?.email) {
      toast.error('User email not available. Please log in again.');
      return;
    }

    setIsLoading(true);
    setMessage('Generating Pharmacy ID and sending MTP to your email...');

    try {
      const credentials = await generatePharmacyCredentials(); // This function handles saving to Firestore and sending email
      if (credentials) {
        setPharmacyId(credentials.pharmacyId);
        setMtpSent(true);
        setMessage(`An MTP has been sent to ${user.email}. Please check your inbox.`);
        toast.success('MTP sent successfully!');
      } else {
        setMessage('Failed to generate credentials. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to send MTP:', err);
      setMessage(`Failed to send MTP: ${err.message}. Please try again.`);
      toast.error(`Failed to send MTP: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated. Please log in again.');
      return;
    }

    const enteredMtp = mtpInput.join('');
    if (enteredMtp.length !== 6) {
      toast.warn('Please enter the complete 6-digit MTP.');
      return;
    }

    setIsLoading(true);
    setMessage('Verifying MTP...');

    try {
      // Use the verifyPharmacy function from AuthContext
      const isVerified = await verifyPharmacy(pharmacyId, enteredMtp);

      if (isVerified) {
        setMessage('Your pharmacy account has been verified!');
        toast.success('Verification Successful! Please provide your pharmacy details.');
        navigate('/info-pharmacy'); // Redirect to info-pharmacy page after successful verification
      } else {
        setMessage('Invalid MTP. Please try again.');
        setMtpInput(Array(6).fill('')); // Clear input on failure
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Failed to verify MTP:', error);
      setMessage('Failed to verify MTP. Please try again.');
      toast.error('An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
        <h2 className="text-center text-4xl font-extrabold mb-2 text-gray-800">Pharmacy Verification</h2>
        <p className="text-center text-gray-500 mb-8">
          Complete these steps to activate your pharmacy account.
        </p>

        {message && <p className="text-center text-blue-600 mb-6 font-medium">{message}</p>}

        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-600 font-semibold mb-1">Your Unique Pharmacy ID</p>
            {pharmacyId ? (
              <p className="text-blue-700 font-mono break-all text-lg">{pharmacyId}</p>
            ) : (
              <p className="text-gray-500">Generating ID...</p>
            )}
          </div>

          {!mtpSent && !userData?.pharmacyInfo?.pharmacyId ? (
            <button
              onClick={handleSendMtp}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
            >
              {isLoading ? 'Sending...' : 'Generate ID & Send MTP to My Email'}
            </button>
          ) : (
            <>
              <div>
                <label htmlFor="mtp" className="block text-gray-700 text-sm font-bold mb-3 text-center">
                  Enter the 6-digit MTP sent to your email
                </label>
                <div className="flex justify-center space-x-2 sm:space-x-3">
                  {mtpInput.map((digit, index) => (
                    <input
                      key={index}
                      id={`mtp-${index}`}
                      name="mtp"
                      type="tel" // Use 'tel' for better mobile numeric keyboard
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleMtpChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-all duration-200"
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-center text-gray-500">
                Didn't receive it? Check your spam folder or try sending again after a minute.
              </p>

              <button
                onClick={handleVerifyAndSave}
                disabled={isLoading || mtpInput.join('').length !== 6}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
              >
                {isLoading ? 'Verifying...' : <><FaCheckCircle className="mr-2" />Verify & Complete Setup</>}
              </button>
            </>
          )}
          {mtpSent && !userData?.isPharmacyVerified && (
            <button
              onClick={handleSendMtp}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold flex items-center justify-center disabled:opacity-50 hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-gray-500/50 mt-4"
            >
              {isLoading ? 'Resending...' : 'Resend MTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPharmacyPage;
