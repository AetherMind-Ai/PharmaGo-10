import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import { UserData } from '../types'; // Import UserData type
import L from 'leaflet'; // Import Leaflet library
import { MapPin, Phone, Camera, Image } from 'lucide-react'; // Import icons

// Helper function to generate a random 6-digit OTP
function generateOtp(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

// Fix for default icon issue with Webpack/Parcel
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define a custom red icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


const PharmacyInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, updateUserProfile } = useAuth(); // Destructure userData and updateUserProfile

  const [pharmacyId, setPharmacyId] = useState(''); // Declare pharmacyId state
  const [pharmacyName, setPharmacyName] = useState('');
  const [vodafoneCash, setVodafoneCash] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [pharmacyImages, setPharmacyImages] = useState<Array<string | null>>([null, null, null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [vodafoneCashError, setVodafoneCashError] = useState('');
  const [addressError, setAddressError] = useState('');
  const mapRef = useRef<L.Map | null>(null); // Use useRef for map instance
  const markerRef = useRef<L.Marker | null>(null); // Use useRef for marker instance

  useEffect(() => {
    if (!user) {
      // Redirect if user is not authenticated
      toast.error('You need to be logged in to access this page.');
      navigate('/login'); // Or wherever your login page is
      return;
    }

    // Initialize pharmacyId from userData if available
    if (user && userData?.pharmacyInfo?.pharmacyId) {
      setPharmacyId(userData.pharmacyInfo.pharmacyId);
    }

    // Initialize map
    if (!mapRef.current) { // Check if map is already initialized using ref
      const mapElement = document.getElementById('map');
      if (mapElement) { // Ensure map container exists
        const initialMap = L.map(mapElement).setView([31.0461, 31.2249], 13); // Default view (e.g., Egypt)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(initialMap);

        initialMap.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          // Generate a simple map link (e.g., Google Maps format)
          setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);

          // Remove existing marker if any
          if (markerRef.current) { // Use markerRef
            markerRef.current.remove();
          }

          // Add new marker at clicked location with red icon
          if (mapRef.current) { // Ensure mapRef.current is not null before adding marker
            markerRef.current = L.marker([lat, lng], { icon: redIcon }).addTo(mapRef.current); // Use redIcon
          }
        });

        mapRef.current = initialMap; // Store map in ref
      }
    }

    // Cleanup map on component unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) { // Use mapRef for cleanup
        mapRef.current.remove();
        mapRef.current = null; // Clear ref
      }
    };
  }, [user, userData, navigate]); // Add userData to dependency array

  const handleVodafoneCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and limit to 10 characters
    const filteredValue = value.replace(/\D/g, '').slice(0, 10);
    setVodafoneCash(filteredValue);
    // Clear error on change
    setVodafoneCashError('');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only Arabic characters, spaces, and common punctuation used in addresses
    const arabicRegex = /^[\u0600-\u06FF\s.,،؛:()\[\]{}<>'"!@#$%^&*_+=\-\/\\?؟]+$/;
    if (value === '' || arabicRegex.test(value)) {
      setAddress(value);
      // Clear error on change
      setAddressError('');
    } else {
      // Optionally, prevent typing non-Arabic characters or show a temporary message
      // For now, we just don't update the state if it contains invalid characters
      // A more user-friendly approach might be needed depending on UX requirements
    }
  };


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (index === undefined) {
            setLogoImage(reader.result);
          } else {
            const newImages = [...pharmacyImages];
            newImages[index] = reader.result;
            setPharmacyImages(newImages);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated.');
      return;
    }

    // Validation checks
    let isValid = true;
    setVodafoneCashError('');
    setAddressError('');

    // Vodafone Cash validation: 10 digits, does not start with 0
    if (vodafoneCash.length !== 10 || vodafoneCash.startsWith('0')) {
      setVodafoneCashError('Vodafone Cash number must be exactly 10 digits and cannot start with 0.');
      isValid = false;
    }

    // Address validation: Arabic language only
    const arabicRegex = /^[\u0600-\u06FF\s.,،؛:()\[\]{}<>'"!@#$%^&*_+=\-\/\\?؟]+$/; // Added common punctuation
    if (!arabicRegex.test(address)) {
      setAddressError('Address must be in Arabic language only.');
      isValid = false;
    }


    if (!pharmacyName || !address || !mapLink || !logoImage || pharmacyImages.some(img => img === null)) {
       // Check other required fields
       if (!pharmacyName) toast.warn('Please enter pharmacy name.');
       if (!address) toast.warn('Please enter address.');
       if (!mapLink) toast.warn('Please select location on map.');
       if (!logoImage) toast.warn('Please upload pharmacy logo.');
       if (pharmacyImages.some(img => img === null)) toast.warn('Please upload all 4 pharmacy images.');
       isValid = false; // Mark as invalid if any required field is missing
    }

    if (!isValid) {
      toast.warn('Please fix the errors before saving.');
      return;
    }


    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Use the pharmacyId from the component's state, which should have been set
      // either from userData on load or after calling generatePharmacyCredentials.
      const finalPharmacyId = pharmacyId; 

      const updates: Partial<UserData> = {
        pharmacyInfo: {
          pharmacyId: finalPharmacyId,
          name: pharmacyName,
          vodafoneCash: vodafoneCash,
          address: address,
          mapLink: mapLink,
          logoImage: logoImage,
          pharmacyImages: pharmacyImages,
          mtp: generateOtp(), // Generate a new MTP for the pharmacy (or use existing if re-saving)
          profileViews: 0, // Initialize profileViews
        },
        isPharmacyInfoComplete: true,
        isPharmacyVerified: true,
      };

      await updateDoc(userDocRef, updates);
      await updateUserProfile(updates); // Update local AuthContext state

      toast.success('Pharmacy information saved successfully!');
      // For the first sign-in, redirect to account page directly
      navigate('/account'); 

    } catch (err) {
      console.error('Failed to save pharmacy information:', err);
      toast.error('Failed to save pharmacy information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-5xl transform transition-all duration-500 hover:scale-[1.01] border border-gray-100"> {/* Increased max-w */}
        <h2 className="text-center text-4xl font-extrabold text-gray-900 mb-4 leading-tight">Pharmacy Information</h2>
        <p className="text-gray-600 text-center mb-10 text-lg">Enter your pharmacy details below.</p>

        <div className="flex flex-col md:flex-row gap-8 mb-8"> {/* Flex container for horizontal layout */}
          {/* Left Column: Info Inputs */}
          <div className="flex-1 space-y-6">
            {/* Pharmacy Name */}
            <div>
              <label htmlFor="pharmacyName" className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="pharmacyName"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent"
                  disabled={isLoading}
                  placeholder="Enter pharmacy name"
                />
              </div>
            </div>

            {/* Vodafone Cash Number */}
            <div>
              <label htmlFor="vodafoneCash" className="block text-sm font-medium text-gray-700 mb-1">Vodafone Cash Number</label>
               <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <span className="flex items-center px-4 py-3 bg-gray-50 text-xl font-medium text-gray-700 border-r border-gray-200">🇪🇬 +20</span>
                 <input
                  type="text"
                  id="vodafoneCash"
                  value={vodafoneCash}
                  onChange={handleVodafoneCashChange}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${vodafoneCashError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter The Pharmacy Number"
                  inputMode="numeric" // Suggest numeric keyboard on mobile
                />
              </div>
              {vodafoneCashError && <p className="mt-1 text-sm text-red-600">{vodafoneCashError}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address (Abo Homos only)</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={handleAddressChange}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${addressError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter address in Abo Homos in Arabic"
                  lang="ar" // Suggest Arabic input
                />
              </div>
               {addressError && <p className="mt-1 text-sm text-red-600">{addressError}</p>}
               {/* Note: Validation for "Abo Homos only" is not implemented here */}
            </div>
          </div>

          {/* Right Column: Map and Images */}
          <div className="flex-1 space-y-6">
            {/* Map */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Location on Map</label>
              <div id="map" style={{ height: '400px', width: '100%' }} className="rounded-xl shadow-md border border-gray-300"></div>
              {mapLink && <p className="mt-2 text-sm text-gray-600">Selected Location Link: <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{mapLink}</a></p>}
            </div>

            {/* Pharmacy Logo */}
            <div>
              <label htmlFor="logoImage" className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Logo</label>
              <input
                type="file"
                id="logoImage"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all duration-300 cursor-pointer"
                disabled={isLoading}
              />
               {logoImage && <img src={logoImage} alt="Pharmacy Logo Preview" className="mt-4 h-32 w-32 object-cover rounded-full shadow-md border border-gray-200" />} {/* Added rounded-full */}
            </div>

            {/* Pharmacy Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Images (4 images)</label>
              <div className="grid grid-cols-2 gap-4">
                {pharmacyImages.map((image, index) => (
                  <div key={index} className="aspect-square"> {/* Added aspect-square */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all duration-300 cursor-pointer"
                      disabled={isLoading}
                    />
                    {image && <img src={image} alt={`Pharmacy Image ${index + 1} Preview`} className="mt-2 h-full w-full object-cover rounded-lg shadow-md border border-gray-200" />} {/* Adjusted image size */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveInfo}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
        >
          {isLoading ? 'Saving...' : 'Save Pharmacy Information'}
        </button>
      </div>
    </div>
  );
};

export default PharmacyInfoPage;
