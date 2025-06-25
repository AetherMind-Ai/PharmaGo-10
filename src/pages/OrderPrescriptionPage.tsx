import React, { useState, useEffect } from 'react';
import { FileText, UploadCloud, MapPin, CheckCircle, X, Feather, Send } from 'lucide-react';
import AddressModal from '../components/AddressModal'; // Assuming this component exists
import { mockProducts } from '../data/mockData';
import { Product } from '../types';
import ProductCard from '../components/ProductCard'; // Note: Ensure this component uses 'card-hover' for best effect
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, setDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Order, OrderProduct } from '../types'; // Import Order and OrderProduct types

// A helper component for styled section cards to keep the main component clean
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`card p-6 sm:p-8 mb-8 ${className}`}>
    {children}
  </div>
);

const OrderPrescriptionPage: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [callToConfirm, setCallToConfirm] = useState(false);
  const [unmatchedMedicines, setUnmatchedMedicines] = useState('None');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ addressString: string; mapLink: string | null } | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<{
    doctor: string | null;
    clinic: string | null;
    date: string | null;
    time: string | null;
    medicines: string[];
  } | null>(null);
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const clearFileSelection = () => {
    setSelectedFile(null);
    setUploadedImageUrl(null);
    setExtractedInfo(null);
    setMatchingProducts([]);
    setUnmatchedMedicines('None');
    // Keep productName in case user wants to switch from upload to manual
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous analysis when a new file is selected
    clearFileSelection();

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        // This is the data URL (Base64) of the image
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (extractedInfo && extractedInfo.medicines.length > 0) {
      const filteredProducts = mockProducts.filter(product =>
        extractedInfo.medicines.some(medicine =>
          product.name.toLowerCase().includes(medicine.toLowerCase())
        )
      );
      setMatchingProducts(filteredProducts);

      const foundMedicineNames = new Set(filteredProducts.map(p => p.name.toLowerCase()));
      const currentUnmatched = extractedInfo.medicines.filter(medicine =>
        !foundMedicineNames.has(medicine.toLowerCase())
      );

      setUnmatchedMedicines(currentUnmatched.length > 0 ? currentUnmatched.join(', ') : 'None');
    } else {
      setMatchingProducts([]);
      setUnmatchedMedicines('None');
    }
  }, [extractedInfo]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAddress || !selectedAddress.addressString) {
      toast.error('Please choose an address to deliver to.');
      return;
    }

    if (!user || !userData) {
      toast.error('You must be logged in to submit an order.');
      return;
    }
    
    // Disable submission if required fields are empty
    if ((!selectedFile && !productName) || !callToConfirm) {
        toast.error("Please provide your order details and confirm the availability preference.");
        return;
    }


    const productsTotalPrice = matchingProducts.reduce((sum, product) => sum + product.price, 0);
    const deliveryFee = 10;
    const tax = 5;
    const totalPrice = productsTotalPrice + deliveryFee + tax;

    // Determine pharmacyId and pharmacyName from the first matching product, if any
    let pharmacyId: string | undefined;
    let pharmacyName: string | undefined;

    if (matchingProducts.length > 0 && matchingProducts[0].pharmacyName) {
      pharmacyName = matchingProducts[0].pharmacyName;
      // Attempt to find pharmacyId based on pharmacyName
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'Pharmacy'), where('pharmacyInfo.name', '==', pharmacyName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          pharmacyId = querySnapshot.docs[0].id;
        }
      } catch (error) {
        console.error('Error fetching pharmacy ID:', error);
      }
    }

    const orderItems: OrderProduct[] = matchingProducts.map(product => ({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1, // Assuming 1 quantity for prescription orders
      status: product.inStock ? 'Available' : 'Out of Stock',
    }));

    const orderData: Order = {
      id: doc(collection(db, 'orders')).id, // Generate a new ID for the order document
      userId: user.uid,
      userName: userData.username || user.email?.split('@')[0] || 'N/A',
      fullName: userData.fullName || user.displayName || 'N/A',
      userNumber: userData.phoneNumber || 'N/A',
      userAddress: selectedAddress.addressString,
      userAddressMapLink: selectedAddress.mapLink,
      items: orderItems,
      orderType: 'Prescription Order',
      pharmacyId: pharmacyId,
      pharmacyName: pharmacyName,
      totalPrice: totalPrice,
      deliveryFee: deliveryFee,
      tax: tax,
      status: 'Pending', // Initial status
      orderDate: new Date().toISOString(),
      orderTimestamp: serverTimestamp(),
      paymentMethod: 'cashOnDelivery', // Default for OBP
      uploadedImageLink: uploadedImageUrl,
      doctorName: extractedInfo?.doctor || 'NONE',
      clinicHospitalName: extractedInfo?.clinic || 'NONE',
      prescriptionDate: extractedInfo?.date || 'NONE',
      prescriptionTime: extractedInfo?.time || 'NONE',
      manualProductList: productName,
      notFoundMedicines: unmatchedMedicines,
      consentToConfirm: callToConfirm,
    };

    try {
      // Save to the top-level 'orders' collection
      await setDoc(doc(db, 'orders', orderData.id), orderData);

      toast.success('Order submitted successfully!');
      
      // Navigate to /checkout page with order details
      navigate('/checkout', {
        state: {
          products: orderItems, // Pass orderItems instead of matchingProducts
          totalPrice: totalPrice,
          deliveryFee: deliveryFee,
          tax: tax,
          orderData: orderData // Pass the full order data for display on Payup page
        }
      });

      // Reset form state after successful submission
      clearFileSelection();
      setProductName('');
      setCallToConfirm(false);
      setSelectedAddress(null);

    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order. Please try again.');
    }
  };

  const analyzePrescription = async (file: File) => {
    setIsAnalyzing(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      toast.error('AI feature is currently unavailable.');
      console.error('Gemini API key not found.');
      setExtractedInfo({ doctor: 'Error: API Key not found', clinic: null, date: null, time: null, medicines: [] });
      setIsAnalyzing(false);
      return;
    }

    // Use the already stored base64 string from uploadedImageUrl
    const base64Image = uploadedImageUrl?.split(',')[1];
    if (!base64Image) {
      toast.error('Image data not found. Please re-upload.');
      console.error('Uploaded image URL is not a valid base64 string.');
      setIsAnalyzing(false);
      return;
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extract the following information from the prescription image: Doctor Name, Clinic/Hospital Name, Date, Time, and a list of Medicine Names. If a piece of information is not found, respond with "NONE" for that field. List the medicine names as a comma-separated list, for example: "Medicine Names: Panadol, Brufen, Amoxil".' },
              { inline_data: { mime_type: file.type, data: base64Image } },
            ],
          }],
        }),
      });

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const lines = text.split('\n');
        const extracted: { doctor: string | null; clinic: string | null; date: string | null; time: string | null; medicines: string[]; } = { doctor: null, clinic: null, date: null, time: null, medicines: [] };

        lines.forEach((line: string) => {
          if (line.toLowerCase().startsWith('doctor name:')) extracted.doctor = line.substring(12).trim();
          else if (line.toLowerCase().startsWith('clinic/hospital name:')) extracted.clinic = line.substring(21).trim();
          else if (line.toLowerCase().startsWith('date:')) extracted.date = line.substring(5).trim();
          else if (line.toLowerCase().startsWith('time:')) extracted.time = line.substring(5).trim();
          else if (line.toLowerCase().startsWith('medicine names:')) {
            const medStr = line.substring(15).trim();
            extracted.medicines = medStr.toUpperCase() === 'NONE' ? [] : medStr.split(',').map((m: string) => m.trim()).filter(Boolean);
          }
        });

        setExtractedInfo(extracted);
        if (extracted.medicines.length > 0) setProductName(extracted.medicines.join(', '));
        
      } catch (error: any) {
        toast.error("AI analysis failed. Please enter medicines manually.");
        console.error('Error analyzing prescription:', error);
        setExtractedInfo({ doctor: `Error: ${error.message}`, clinic: null, date: null, time: null, medicines: [] });
      } finally {
        setIsAnalyzing(false);
      }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-8">
            <span className="text-gradient">Order with Prescription</span>
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Address Section */}
            <SectionCard>
              <h2 className="text-xl font-semibold text-dark-blue mb-4 flex items-center">
                <MapPin size={24} className="text-medium-blue mr-3" /> Delivery Address
              </h2>
              <button
                type="button"
                className={`w-full p-4 border rounded-lg transition-all duration-200 flex items-center justify-center text-left ${
                  selectedAddress
                    ? 'bg-light-blue/50 border-medium-blue text-dark-blue font-semibold'
                    : 'border-dashed border-gray-400 text-gray-600 hover:border-dark-blue hover:text-dark-blue'
                }`}
                onClick={() => setIsAddressModalOpen(true)}
              >
                {selectedAddress ? (
                  <>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0 text-medium-blue" />
                    <span className="truncate">Deliver to: <strong>{selectedAddress.addressString}</strong></span>
                  </>
                ) : (
                  <span>+ Add Delivery Address</span>
                )}
              </button>
              {!selectedAddress && <p className="text-red-500 text-sm mt-2">Address selection is required.</p>}
            </SectionCard>

            {/* Upload Prescription Section */}
            <SectionCard>
              <h2 className="text-xl font-semibold text-dark-blue mb-4 flex items-center">
                <UploadCloud size={24} className="text-medium-blue mr-3" /> Upload Prescription
              </h2>
              <label htmlFor="prescriptionFile" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-cream/50 hover:border-medium-blue hover:bg-light-blue/30 transition-colors duration-200">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <Feather className="w-10 h-10 mb-4 text-gray-400" />
                  {selectedFile ? (
                    <p className="font-semibold text-sm text-dark-blue">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-dark-blue">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-400">PNG, JPG (MAX. 10MB)</p>
                    </>
                  )}
                </div>
                <input id="prescriptionFile" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
              </label>

              {uploadedImageUrl && (
                 <div className="mt-6 relative group">
                    <img src={uploadedImageUrl} alt="Uploaded Prescription" className="w-full max-h-96 object-contain rounded-lg shadow-lg border border-gray-200" />
                    <button type="button" onClick={clearFileSelection} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100">
                        <X size={16} />
                    </button>
                </div>
              )}

              {selectedFile && !isAnalyzing && !extractedInfo && (
                <div className="mt-6 flex justify-center">
                  <button type="button" onClick={() => analyzePrescription(selectedFile)} className="btn-outline py-2">
                    Analyze with AI
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-6 flex justify-center items-center text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medium-blue"></div>
                  <p className="ml-3">Analyzing, please wait...</p>
                </div>
              )}

              {extractedInfo && (
                <div className="mt-6 p-4 bg-light-blue/30 rounded-lg border border-medium-blue/30">
                  <h3 className="text-lg font-semibold text-dark-blue mb-3">Analysis Results:</h3>
                   <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex justify-between border-b border-light-blue py-1"><dt className="font-medium text-gray-600">Doctor:</dt><dd className="text-gray-800 text-right">{extractedInfo.doctor || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-light-blue py-1"><dt className="font-medium text-gray-600">Clinic:</dt><dd className="text-gray-800 text-right">{extractedInfo.clinic || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-light-blue py-1"><dt className="font-medium text-gray-600">Date:</dt><dd className="text-gray-800 text-right">{extractedInfo.date || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-light-blue py-1"><dt className="font-medium text-gray-600">Time:</dt><dd className="text-gray-800 text-right">{extractedInfo.time || 'N/A'}</dd></div>
                    <div className="sm:col-span-2 pt-2"><dt className="font-medium text-gray-600">Medicines:</dt><dd className="text-gray-800 mt-1">{extractedInfo.medicines.length > 0 ? extractedInfo.medicines.join(', ') : 'N/A'}</dd></div>
                  </dl>
                </div>
              )}

              {matchingProducts.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-dark-blue mb-4">Available Products Based on Analysis:</h3>
                  <div className="flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-hide">
                    {matchingProducts.map(product => (
                      <div key={product.id} className="flex-shrink-0 w-52">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
            
            <div className="text-center text-gray-400 my-4 font-semibold">OR</div>

            {/* Manual Entry Section */}
            <SectionCard>
                <h2 className="text-xl font-semibold text-dark-blue mb-4 flex items-center">
                    <FileText size={22} className="text-medium-blue mr-3" /> Manually Add Items
                </h2>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Type names of medicine or products you need</label>
                        <textarea id="productName" value={productName} onChange={(e) => setProductName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medium-blue" 
                            placeholder="e.g., Panadol Extra, Vitamin C 1000mg, Dettol Antiseptic" rows={3}/>
                    </div>
                    {extractedInfo && (
                    <div>
                        <label htmlFor="unmatchedMedicines" className="block text-sm font-medium text-gray-700 mb-1">Medicines not found by AI (if any)</label>
                        <p className="text-xs text-gray-500 mb-2">Please edit manually for accuracy. This helps us find the right products for you.</p>
                        <textarea id="unmatchedMedicines" value={unmatchedMedicines} onChange={(e) => setUnmatchedMedicines(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medium-blue"
                            placeholder="e.g., Unlisted Cream 2%" rows={2}/>
                    </div>
                    )}
                </div>
            </SectionCard>

            <SectionCard>
              <h2 className="text-xl font-semibold text-dark-blue mb-4">Availability Preference</h2>
              <p className="text-sm text-gray-600 mb-4">What should we do if a product is not available? <span className="text-red-500 font-medium"> (Required)</span></p>
              <div className="flex items-center p-3 bg-cream/50 rounded-lg">
                <input id="callToConfirm" type="checkbox" checked={callToConfirm} onChange={(e) => setCallToConfirm(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-medium-blue" />
                <label htmlFor="callToConfirm" className="ml-3 block text-sm font-medium text-gray-700">
                  Call me to confirm alternatives or changes.
                </label>
              </div>
            </SectionCard>

            <button type="submit" className="btn-primary w-full text-lg" disabled={isAnalyzing || (!selectedFile && !productName) || !callToConfirm || !selectedAddress}>
                { isAnalyzing ? "Analyzing..." : "Submit Order"}
            </button>
          </form>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)}
            onAddressSelect={(address) => { setSelectedAddress(address); setIsAddressModalOpen(false); }}
          />
          {/* --- UPDATED "HOW TO ORDER" SECTION --- */}
          <div className="card p-8 sticky top-8 bg-white shadow-lg rounded-xl">
            <h2 className="text-3xl font-bold text-dark-blue mb-8">How It Works</h2>
            <ol className="relative border-l border-dashed border-gray-300 ml-6">
              <li className="mb-12 ml-12">
                <span className="absolute flex items-center justify-center w-12 h-12 bg-light-blue/70 rounded-full -left-6 ring-8 ring-white">
                  <MapPin className="w-6 h-6 text-medium-blue" />
                </span>
                <h3 className="font-semibold text-dark-blue text-lg">Choose Address</h3>
                <p className="text-sm text-gray-600 mt-1">Select the location for your delivery.</p>
              </li>
              <li className="mb-12 ml-12">
                <span className="absolute flex items-center justify-center w-12 h-12 bg-light-blue/70 rounded-full -left-6 ring-8 ring-white">
                  <FileText className="w-6 h-6 text-medium-blue" />
                </span>
                <h3 className="font-semibold text-dark-blue text-lg">Provide Your Order</h3>
                <p className="text-sm text-gray-600 mt-1">Upload a prescription or type the product names you need.</p>
              </li>
              <li className="ml-12">
                <span className="absolute flex items-center justify-center w-12 h-12 bg-light-blue/70 rounded-full -left-6 ring-8 ring-white">
                  <Send className="w-6 h-6 text-medium-blue" />
                </span>
                <h3 className="font-semibold text-dark-blue text-lg">Confirm & Submit</h3>
                <p className="text-sm text-gray-600 mt-1">Our team will process your request and contact you for confirmation.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrescriptionPage;
