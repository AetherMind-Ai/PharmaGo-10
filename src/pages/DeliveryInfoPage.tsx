import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Phone, Camera, Image } from 'lucide-react';
import { generateMTP } from '../utils/mtpGenerator';

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


const DeliveryInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth(); // Destructure userData

  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('PGDC-F1sGJ63iPh'); // Set constant company ID
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [companyImage, setCompanyImage] = useState<string | null>(null);
  const [deliveryManImage, setDeliveryManImage] = useState<string | null>(null);
  const [motorBikeId, setMotorBikeId] = useState('');
  const [mtp, setMtp] = useState(''); // Add state for MTP
  const [isLoading, setIsLoading] = useState(false);

  const [companyNumberError, setCompanyNumberError] = useState('');
  const [deliveryNumberError, setDeliveryNumberError] = useState('');
  const [companyAddressError, setCompanyAddressError] = useState('');
  const [motorBikeIdError, setMotorBikeIdError] = useState('');

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Redirect if user is not logged in or not a Delivery role
    if (!user) {
      toast.error('You need to be logged in to access this page.');
      navigate('/login');
      return;
    }
    // If delivery info is already complete, redirect to account page
    if (userData?.role === 'Delivery' && userData?.isDeliveryInfoComplete) {
      toast.info('Your delivery profile is already complete.');
      navigate('/account');
      return;
    }

    if (!mapRef.current) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const initialMap = L.map(mapElement).setView([31.0461, 31.2249], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(initialMap);

        initialMap.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);

          if (markerRef.current) {
            markerRef.current.remove();
          }

          if (mapRef.current) {
            markerRef.current = L.marker([lat, lng], { icon: redIcon }).addTo(mapRef.current);
          }
        });

        mapRef.current = initialMap;
      }
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [user, navigate]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, setError: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/\D/g, '').slice(0, 10);
    setter(filteredValue);
    setError('');
  };

  const handleCompanyAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const arabicRegex = /^[\u0600-\u06FF\s.,،؛:()\[\]{}<>'"!@#$%^&*_+=\-\/\\?؟]+$/;
    if (value === '' || arabicRegex.test(value)) {
      setCompanyAddress(value);
      setCompanyAddressError('');
    }
  };

  const handleMotorBikeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Regex for 4 numbers, then space, then 3 Arabic letters
    const motorBikeIdRegex = /^(\d{0,4})( ?)([\u0600-\u06FF]{0,3})$/;
    if (motorBikeIdRegex.test(value)) {
      setMotorBikeId(value);
      setMotorBikeIdError('');
    } else {
      setMotorBikeIdError('Motorbike ID must be 4 numbers, then a space, then 3 Arabic letters.');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'company' | 'deliveryMan') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'company') {
            setCompanyImage(reader.result);
          } else {
            setDeliveryManImage(reader.result);
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

    let isValid = true;
    setCompanyNumberError('');
    setDeliveryNumberError('');
    setCompanyAddressError('');
    setMotorBikeIdError('');

    // Company ID validation
    if (!companyId.startsWith('PGDC-') || companyId.length !== 15) {
      toast.warn('Company ID must start with "PGDC-" and be 15 characters long.');
      isValid = false;
    }

    // Company Number validation: 10 digits, does not start with 0
    if (companyNumber.length !== 10 || companyNumber.startsWith('0')) {
      setCompanyNumberError('Company number must be exactly 10 digits and cannot start with 0.');
      isValid = false;
    }

    // Delivery Number validation: 10 digits, does not start with 0
    if (deliveryNumber.length !== 10 || deliveryNumber.startsWith('0')) {
      setDeliveryNumberError('Delivery number must be exactly 10 digits and cannot start with 0.');
      isValid = false;
    }

    // Company Address validation: Arabic language only and "Abo Homos"
    const arabicRegex = /^[\u0600-\u06FF\s.,،؛:()\[\]{}<>'"!@#$%^&*_+=\-\/\\?؟]+$/;
    if (!arabicRegex.test(companyAddress) || !companyAddress.includes('ابو حمص')) { // Check for "Abo Homos" in Arabic
      setCompanyAddressError('Address must be in Arabic language only and contain "ابو حمص".');
      isValid = false;
    }

    // Motorbike ID validation: 4 numbers, space, 3 Arabic letters
    const motorBikeIdStrictRegex = /^\d{4} [\u0600-\u06FF]{3}$/;
    if (!motorBikeIdStrictRegex.test(motorBikeId)) {
      setMotorBikeIdError('Motorbike ID must be 4 numbers, then a space, then 3 Arabic letters.');
      isValid = false;
    }

    if (!companyName || !mapLink || !companyImage || !deliveryManImage) {
       if (!companyName) toast.warn('Please enter company name.');
       if (!mapLink) toast.warn('Please select location on map.');
       if (!companyImage) toast.warn('Please upload company image.');
       if (!deliveryManImage) toast.warn('Please upload delivery man image.');
       isValid = false;
    }

    if (!isValid) {
      toast.warn('Please fix the errors before saving.');
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const generatedMtp = generateMTP(); // Generate MTP
      setMtp(generatedMtp); // Store it in state

      await updateDoc(userDocRef, {
        deliveryInfo: {
          companyName: companyName,
          companyId: companyId,
          companyAddress: companyAddress,
          companyNumber: companyNumber,
          deliveryNumber: deliveryNumber,
          mapLink: mapLink,
          companyImage: companyImage,
          deliveryManImage: deliveryManImage,
          motorBikeId: motorBikeId,
          mtp: generatedMtp, // Save MTP to Firestore
        },
        isDeliveryInfoComplete: true,
      });

      toast.success('Delivery information saved successfully! Redirecting to account page...');
      navigate('/account'); // Navigate directly to /account page

    } catch (err) {
      console.error('Failed to save delivery information:', err);
      toast.error('Failed to save delivery information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-5xl transform transition-all duration-500 hover:scale-[1.01] border border-gray-100">
        <h2 className="text-center text-4xl font-extrabold text-gray-900 mb-4 leading-tight">Delivery Information</h2>
        <p className="text-gray-600 text-center mb-10 text-lg">Enter your delivery details below.</p>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Left Column: Info Inputs */}
          <div className="flex-1 space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent"
                  disabled={isLoading}
                  placeholder="Enter company name"
                />
              </div>
            </div>

            {/* Company ID */}
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="companyId"
                  value={companyId}
                  className="flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent"
                  disabled={true} // Disable editing
                  placeholder="PGDC-F1sGJ63iPh"
                />
              </div>
            </div>

            {/* Company Number */}
            <div>
              <label htmlFor="companyNumber" className="block text-sm font-medium text-gray-700 mb-1">Company Number</label>
               <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <span className="flex items-center px-4 py-3 bg-gray-50 text-xl font-medium text-gray-700 border-r border-gray-200">🇪🇬 +20</span>
                 <input
                  type="text"
                  id="companyNumber"
                  value={companyNumber}
                  onChange={(e) => handleNumberChange(e, setCompanyNumber, setCompanyNumberError)}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${companyNumberError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter Company Number"
                  inputMode="numeric"
                />
              </div>
              {companyNumberError && <p className="mt-1 text-sm text-red-600">{companyNumberError}</p>}
            </div>

            {/* Delivery Number */}
            <div>
              <label htmlFor="deliveryNumber" className="block text-sm font-medium text-gray-700 mb-1">Delivery Number</label>
               <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <span className="flex items-center px-4 py-3 bg-gray-50 text-xl font-medium text-gray-700 border-r border-gray-200">🇪🇬 +20</span>
                 <input
                  type="text"
                  id="deliveryNumber"
                  value={deliveryNumber}
                  onChange={(e) => handleNumberChange(e, setDeliveryNumber, setDeliveryNumberError)}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${deliveryNumberError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter Delivery Number"
                  inputMode="numeric"
                />
              </div>
              {deliveryNumberError && <p className="mt-1 text-sm text-red-600">{deliveryNumberError}</p>}
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">Company Address (Abo Homos only, in Arabic)</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="companyAddress"
                  value={companyAddress}
                  onChange={handleCompanyAddressChange}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${companyAddressError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="ادخل عنوان الشركة في ابو حمص"
                  lang="ar"
                />
              </div>
               {companyAddressError && <p className="mt-1 text-sm text-red-600">{companyAddressError}</p>}
            </div>

            {/* Motorbike ID */}
            <div>
              <label htmlFor="motorBikeId" className="block text-sm font-medium text-gray-700 mb-1">Motorbike ID (e.g., 1234 ابت)</label>
              <div className="relative flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-3 focus-within:ring-blue-400 transition-all duration-300">
                <input
                  type="text"
                  id="motorBikeId"
                  value={motorBikeId}
                  onChange={handleMotorBikeIdChange}
                  className={`flex-1 py-3 px-4 outline-none text-gray-800 text-xl bg-transparent ${motorBikeIdError ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  placeholder="Enter Motorbike ID (e.g., 1234 ابت)"
                />
              </div>
               {motorBikeIdError && <p className="mt-1 text-sm text-red-600">{motorBikeIdError}</p>}
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

            {/* Company Image */}
            <div>
              <label htmlFor="companyImage" className="block text-sm font-medium text-gray-700 mb-1">Company Image</label>
              <input
                type="file"
                id="companyImage"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'company')}
                className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all duration-300 cursor-pointer"
                disabled={isLoading}
              />
               {companyImage && <img src={companyImage} alt="Company Preview" className="mt-4 h-32 w-32 object-cover rounded-full shadow-md border border-gray-200" />}
            </div>

            {/* Delivery Man Image */}
            <div>
              <label htmlFor="deliveryManImage" className="block text-sm font-medium text-gray-700 mb-1">Delivery Man Image</label>
              <input
                type="file"
                id="deliveryManImage"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'deliveryMan')}
                className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all duration-300 cursor-pointer"
                disabled={isLoading}
              />
              {deliveryManImage && <img src={deliveryManImage} alt="Delivery Man Preview" className="mt-2 h-32 w-32 object-cover rounded-full shadow-md border border-gray-200" />}
            </div>
          </div>
        </div>

        {/* Redirect Message */}
        <p className="text-center text-lg text-green-600 font-semibold mb-4 animate-fade-in">
          Click <span className="text-blue-700 cursor-pointer hover:underline" onClick={() => navigate('/account')}>here</span> to navigate to the /account page
        </p>

        {/* Save Button */}
        <button
          onClick={handleSaveInfo}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
        >
          {isLoading ? 'Saving...' : 'Save Delivery Information'}
        </button>
      </div>
    </div>
  );
};

export default DeliveryInfoPage;
