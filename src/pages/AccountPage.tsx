import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FaCamera, FaSpinner,
  FaUser, FaEnvelope, FaAt, FaPhone, FaMapMarkerAlt, FaMailBulk, FaGlobeAmericas, FaCity,
  FaShoppingCart, FaChartBar, FaSignOutAlt, FaSave, FaEdit, FaListAlt
} from 'react-icons/fa';

// --- Helper Components for a Cleaner Structure ---

// A single progress bar item for the Project Status card
const ProgressBar: React.FC<{ label: string; percentage: number }> = ({ label, percentage }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm text-gray-600">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

// A single social link item
const SocialLink: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <li className="flex items-center justify-between py-3 border-b border-gray-200">
    <div className="flex items-center text-gray-700">
      <span className="text-xl mr-3">{icon}</span>
      {label}
    </div>
    <span className="text-gray-500">{value}</span>
  </li>
);

// Helper function to get role-based description
const getRoleDescription = (role: string | undefined, fullName: string | undefined) => {
  const userName = fullName || 'User';
  switch (role) {
    case 'client':
      return `I am ${userName}, and I use PharmaGo to easily browse and purchase health and wellness products.
It’s a simple and reliable way for me to get everything I need delivered to my door.`;
    case 'pharmacy':
      return `I am ${userName}, and I use PharmaGo to manage, list, and sell pharmaceutical products online.
PharmaGo helps me reach more customers and grow my pharmacy business with ease.`;
    case 'delivery':
      return `I am ${userName}, and I use PharmaGo to pick up and deliver medical products quickly and efficiently.
With PharmaGo, I stay organized and ensure timely deliveries to clients and pharmacies.`;
    default:
      return `Hello, I am ${userName}. I am using PharmaGo to stay connected in the healthcare ecosystem.
It helps me manage everything from orders to communication in one platform.`;
  }
};

// --- Main Account Page Component ---

export const AccountPage: React.FC = () => {
  // --- Hooks and State ---
  const { user, userData, loading, signOutUser, uploadProfilePicture, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // State for About Me section (used for the textarea during editing)
  const [aboutMeText, setAboutMeText] = useState('');
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);

  // --- Effects and Handlers ---
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validation
    if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file.');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
        setUploadError('Image size cannot exceed 5MB.');
        return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
        await uploadProfilePicture(file, user);
    } catch (error) {
        console.error("Error uploading image:", error);
        setUploadError('Failed to upload image.');
    } finally {
        setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleSaveAboutMe = async () => {
    if (user && userData) {
      await updateUserProfile({ aboutMe: aboutMeText });
      setIsEditingAboutMe(false);
    }
  };

  const handleEditAboutMe = () => {
    // When starting to edit, initialize the textarea with the currently displayed text
    setAboutMeText(displayAboutMe); // Use the computed displayAboutMe
    setIsEditingAboutMe(true);
  };

  const handleDashboardClick = () => {
    if (userData?.role === 'Delivery') {
      navigate('/dashboard/delivery');
    } else if (userData?.role === 'Pharmacy') {
      navigate('/dashboard/pharmacy');
    }
  };

  const handleOrdersClick = () => {
    if (userData?.role === 'Delivery') {
      navigate('/delivery-login');
    }
  };

  // --- Loading and Fallback States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || userData.email)}&background=0D8ABC&color=fff&size=128`;

  // Determine the text to display in the "About Me" section
  const roleBasedDescription = getRoleDescription(userData.role, userData.fullName);
  const displayAboutMe = (userData.aboutMe && userData.aboutMe !== '') ? userData.aboutMe : roleBasedDescription;

  // --- Render ---
  return (
    <div className="bg-gray-100 min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>Account</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-700">User Account</span>
        </nav>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div
                className="relative w-32 h-32 mx-auto group cursor-pointer"
                onClick={triggerFileInput}
                title="Change profile picture"
              >
                <img
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                  src={userData.photoDataUrl || user.photoURL || fallbackAvatar}
                  alt="Profile"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-300">
                  {isUploading ? (
                    <FaSpinner className="animate-spin text-white text-3xl" />
                  ) : (
                    <FaCamera className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />
              {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              
              <h3 className="text-2xl font-semibold mt-4">
                {userData.fullName ? userData.fullName.split(' ').slice(0, 2).join(' ') : 'User Name'}
              </h3>
              <p className="text-gray-500">{userData.role || 'User Role'}</p> {/* This line displays the role */}
              <div className="mt-6 flex justify-center gap-3">
                {userData?.role === 'Client' && (
                  <button onClick={() => navigate('/products')} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center">
                    <FaShoppingCart className="mr-2" /> Start Buying
                  </button>
                )}
                {userData?.role === 'Pharmacy' && (
                  <button onClick={handleDashboardClick} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center">
                    <FaChartBar className="mr-2" /> Dashboard
                  </button>
                )}
                {userData?.role === 'Delivery' && (
                  <button onClick={handleOrdersClick} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center">
                    <FaListAlt className="mr-2" /> Orders
                  </button>
                )}
              </div>
            </div>

            {/* Address and Contact Info Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h4>
              <div className="divide-y divide-gray-200">
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium flex items-center"><FaMapMarkerAlt className="mr-2 text-blue-500" />Address</span>
                  <span className="text-gray-800">Governorate Beheira, Abo Homos</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium flex items-center"><FaMailBulk className="mr-2 text-blue-500" />Zip Code</span>
                  <span className="text-gray-800">5935360</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium flex items-center"><FaGlobeAmericas className="mr-2 text-blue-500" />Country</span>
                  <span className="text-gray-800">Egypt</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium flex items-center"><FaCity className="mr-2 text-blue-500" />City</span>
                  <span className="text-gray-800">Abo Homos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* User Details Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="divide-y divide-gray-200">
                    <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600 font-medium flex items-center"><FaUser className="mr-2 text-blue-500" />Full Name</span>
                        <span className="text-gray-800">{userData.fullName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600 font-medium flex items-center"><FaEnvelope className="mr-2 text-blue-500" />Email</span>
                        <span className="text-gray-800">{userData.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600 font-medium flex items-center"><FaAt className="mr-2 text-blue-500" />Username</span>
                        <span className="text-gray-800">{userData.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600 font-medium flex items-center"><FaPhone className="mr-2 text-blue-500" />Phone</span>
                        <span className="text-gray-800">{userData.phoneNumber || 'Not provided'}</span>
                    </div>
                    {userData.role === 'Pharmacy' && userData.pharmacyInfo?.name && (
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium flex items-center"><FaMailBulk className="mr-2 text-blue-500" />Pharmacy Name</span>
                            <span className="text-gray-800">{userData.pharmacyInfo.name}</span>
                        </div>
                    )}
                    {userData.role === 'Pharmacy' && userData.pharmacyInfo?.pharmacyId && (
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium flex items-center"><FaUser className="mr-2 text-blue-500" />Pharmacy ID</span>
                            <span className="text-gray-800">{userData.pharmacyInfo.pharmacyId}</span>
                        </div>
                    )}
                    {userData.role === 'Delivery' && userData.deliveryInfo?.companyId && (
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium flex items-center"><FaUser className="mr-2 text-blue-500" />Delivery Company ID</span>
                            <span className="text-gray-800">{userData.deliveryInfo.companyId}</span>
                        </div>
                    )}
                    {userData.role === 'Delivery' && userData.deliveryInfo?.companyName && (
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium flex items-center"><FaMailBulk className="mr-2 text-blue-500" />Delivery Company Name</span>
                            <span className="text-gray-800">{userData.deliveryInfo.companyName}</span>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    {/* Removed redundant Dashboard button here as it's now in the profile card */}
                    <button onClick={handleSignOut} className="px-5 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition flex items-center justify-center">
                        <FaSignOutAlt className="mr-2" /> Sign Out
                    </button>
                </div>
            </div>

            {/* About Me Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">About Me</h4>
              {isEditingAboutMe ? (
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={aboutMeText} // This uses the state for editing
                  onChange={(e) => setAboutMeText(e.target.value)}
                ></textarea>
              ) : (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {displayAboutMe} {/* This uses the computed value */}
                </p>
              )}
              <div className="flex justify-end gap-3">
                {isEditingAboutMe ? (
                  <button
                    onClick={handleSaveAboutMe}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <FaSave className="mr-2" /> Save
                  </button>
                ) : (
                  <button
                    onClick={handleEditAboutMe} // Changed to new handler
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center justify-center"
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
