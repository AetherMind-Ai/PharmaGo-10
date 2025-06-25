import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Phone } from 'lucide-react';

const NumberInputPage: React.FC = () => {
  const { userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Redirect to login if userData is not available
  useEffect(() => {
    if (!userData) {
      navigate('/login');
    }
  }, [userData, navigate]);

  useEffect(() => {
    if (userData && userData.phoneNumber) {
      navigate('/role');
    }
  }, [userData, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits
    const digitsOnly = value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);

    // Live validation: exactly 10 digits and does not start with 0
    const isValidInput = digitsOnly.length === 10 && digitsOnly.charAt(0) !== '0';
    setIsValid(isValidInput);
  };

  const handleSaveNumber = async () => {
    if (!phoneNumber) {
      setError('Phone number is required.');
      return;
    }

    // Final validation: exactly 10 digits and does not start with 0
    if (phoneNumber.length !== 10 || phoneNumber.charAt(0) === '0') {
      setError('Please enter a valid 10-digit phone number that does not start with 0.');
      return;
    }

    setError('');
    try {
      await updateUserProfile({ phoneNumber: phoneNumber, fullName: userData?.fullName || '' });
      navigate('/role');
    } catch (err: any) {
      setError(`Failed to save phone number: ${err.message}`);
    }
  };

  // Render nothing while redirecting
  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 sm:p-10 text-center transform transition-all duration-500 hover:scale-[1.02] border border-gray-100">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-100 rounded-full inline-flex items-center justify-center shadow-inner">
            <Phone className="w-12 h-12 text-blue-600" strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">Verify Your Number</h2>
        <p className="text-gray-600 text-center mb-10 text-lg">Please enter your Egyptian phone number to continue.</p>

        <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden mb-6 focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
          <span className="flex items-center px-4 py-3 bg-gray-50 text-xl font-medium text-gray-700 border-r border-gray-200">🇪🇬 +20</span>
          <input
            type="tel"
            placeholder="Eg. 1234567890" // Updated placeholder
            value={phoneNumber}
            onChange={handleInputChange}
            onKeyPress={(event) => {
              // Allow only numbers (0-9) and prevent other characters
              if (!/[0-9]/.test(event.key)) {
                event.preventDefault();
              }
            }}
            className="flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent"
            maxLength={10} // Changed max length to 10
          />
          {isValid && (
            <CheckCircle className="text-green-500 mr-4" size={28} />
          )}
        </div>

        {error && <p className="text-red-600 text-base mb-8 text-left font-medium">{error}</p>}

        <button
          onClick={handleSaveNumber}
          disabled={!isValid}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Continue
        </button>

      </div>
    </div>
  );
};

export default NumberInputPage;
