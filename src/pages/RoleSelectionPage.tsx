import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Pill, User } from 'lucide-react'; // Updated icons
import { toast } from 'react-toastify'; // Import toast

const RoleSelectionPage: React.FC = () => {
  const { userData, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Redirect to login if userData is not available
  useEffect(() => {
    if (!userData) {
      navigate('/login');
    }
  }, [userData, navigate]);

  useEffect(() => {
    if (userData && userData.role) {
      navigate('/account');
    }
  }, [userData, navigate]);

  const handleNext = async () => {
    console.log('handleNext called');
    if (!selectedRole) {
      console.log('No role selected, returning.');
      return;
    }
    console.log('Selected role:', selectedRole);

    try {
      console.log('Calling updateUserRole with role:', selectedRole);
      await updateUserRole(selectedRole);
      console.log('updateUserRole successful');
      toast.success('Role selected successfully!', { position: 'bottom-left' }); // Add success toast

      if (selectedRole === 'Pharmacy') {
        navigate('/verify-pharmacy');
      } else if (selectedRole === 'Delivery') {
        if (userData?.isDeliveryInfoComplete) {
          navigate('/verify-delivery-login');
        } else {
          navigate('/info-delivery');
        }
      } else { // Client role
        navigate('/account');
      }
    } catch (err: any) {
      console.error('Error selecting role:', err.message);
      toast.error(`Failed to select role: ${err.message}`, { position: 'bottom-center' }); // Display error message, changed position
    }
  };

  const roles = [
    {
      title: 'Delivery',
      icon: <Package className="w-12 h-12 text-blue-400 mb-4" />,
    },
    {
      title: 'Pharmacy',
      icon: <Pill className="w-12 h-12 text-blue-400 mb-4" />,
    },
    {
      title: 'Client',
      icon: <User className="w-12 h-12 text-blue-400 mb-4" />,
    },
  ];

  // Render nothing while redirecting
  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-3xl transform transition-all duration-500 hover:scale-[1.01] border border-gray-100">
        <h2 className="text-center text-4xl font-extrabold text-gray-900 mb-4 leading-tight">SELECT USER TYPE</h2>
        <p className="text-gray-600 text-center mb-10 text-lg">Choose the role that best describes you.</p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-10">
          {roles.map((role) => (
            <div
              key={role.title}
              onClick={() => setSelectedRole(role.title)}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all duration-300 w-full md:w-52 shadow-lg border-2 ${
                selectedRole === role.title
                  ? 'border-blue-600 bg-blue-50 transform scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
              } bg-white`}
            >
              {role.icon}
              <span className="text-xl font-bold text-gray-800 mt-2">{role.title}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/number')}
            className="px-8 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedRole}
            className={`px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 text-lg shadow-lg transform hover:-translate-y-1 ${
              selectedRole
                ? 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300'
                : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
