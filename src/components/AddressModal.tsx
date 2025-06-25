import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Link, Copy } from 'lucide-react';
import L from 'leaflet'; // Import Leaflet core library
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: { addressString: string; mapLink: string | null }) => void; // New prop for selecting address and map link
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onAddressSelect }) => {
  const [manualAddress, setManualAddress] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null); // Ref to store the marker instance

  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstance.current) {
      // Initialize the map centered on Abou Homos City, Beheira, Egypt
      mapInstance.current = L.map(mapRef.current).setView([31.09206, 30.31634], 12);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);

      // Define a custom red icon
      const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add a click listener to the map
      mapInstance.current.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
        setGoogleMapsLink(link);

        // Remove existing marker if any
        if (markerInstance.current) {
          markerInstance.current.remove();
        }

        // Add new marker at clicked location with red icon
        if (mapInstance.current) { // Ensure mapInstance is not null before adding marker
          markerInstance.current = L.marker([lat, lng], { icon: redIcon }).addTo(mapInstance.current);
        }
      });
    }

    // Clean up the map and marker instances on unmount or modal close
    return () => {
      if (markerInstance.current) {
        markerInstance.current.remove();
        markerInstance.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCopyLink = () => {
    if (googleMapsLink) {
      navigator.clipboard.writeText(googleMapsLink);
      // Optionally, add a toast or visual feedback
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-dark-blue mb-6">Add New Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Map Area */}
          <div ref={mapRef} className="h-96 rounded-lg overflow-hidden" />

          {/* Right Side: Text Areas */}
          <div className="flex flex-col space-y-4">
            {/* Manual Address */}
            <div>
              <label htmlFor="manualAddress" className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={16} className="inline-block mr-1 text-gray-500" /> Manual Address
              </label>
              <textarea
                id="manualAddress"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-medium-blue focus:border-medium-blue"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyPress={(e) => {
                  const arabicRegex = /[\u0600-\u06FF\s]/;
                  if (!arabicRegex.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="رجاء ادخل عنوانك داخل ابوحمص فقط باللغة العربيه"
              />
            </div>

             {/* Google Maps Link */}
            <div>
              <label htmlFor="googleMapsLink" className="block text-sm font-medium text-gray-700 mb-1">
                <Link size={16} className="inline-block mr-1 text-gray-500" /> Map Coordinates Link
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="googleMapsLink"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-medium-blue focus:border-medium-blue"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="Click on the map to get coordinates link"
                  readOnly
                />
                <button
                  className="p-3 bg-gray-200 rounded-r-lg hover:bg-gray-300 transition-colors duration-200"
                  onClick={handleCopyLink}
                  aria-label="Copy Map Coordinates link"
                >
                  <Copy size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              if (manualAddress || googleMapsLink) {
                onAddressSelect({
                  addressString: manualAddress || googleMapsLink, // Use manual address if available, otherwise map link
                  mapLink: googleMapsLink, // Always include the map link if generated
                });
              } else {
                alert('رجاء ادخل عنوانك داخل ابوحمص فقط باللغة العربيه');
              }
            }}
            className="bg-medium-blue text-white py-2 px-4 rounded-lg hover:bg-dark-blue transition-colors duration-200"
          >
            Confirm Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
