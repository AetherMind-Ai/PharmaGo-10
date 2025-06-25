import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import GoogleSheetUploader from '../components/GoogleSheetUploader';
import {
  AlertCircle,
  Wand2,
  Loader,
  ImageIcon,
  CheckCircle,
  UploadCloud,
  Plus,
  FileSpreadsheet
} from 'lucide-react';

const AddProductPage: React.FC = () => {
  const { userData } = useAuth();

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    images: [] as string[],
    category: '',
    brand: '',
    inStock: true,
    rating: 0,
    reviewCount: 0,
    deliveryTime: '90min',
    tags: [] as string[],
    productAmount: '',
    expiryDate: '',
    prescriptionRequired: false,
    pharmacyName: '',
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'sheet'>('manual');

  useEffect(() => {
    if (userData && userData.pharmacyInfo) {
      const pharmacyInfo = userData.pharmacyInfo;
      if (pharmacyInfo.name) {
        setProductData(prevData => ({
          ...prevData,
          pharmacyName: pharmacyInfo.name,
        }));
      }
    }
  }, [userData]);

  const inputStyle = "block w-full rounded-lg border-2 border-blue-500 shadow-sm transition duration-150 ease-in-out sm:text-base p-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-300";
  const disabledInputStyle = "mt-1 block w-full rounded-lg border-2 border-blue-400 shadow-sm sm:text-base p-2 bg-slate-100 cursor-not-allowed";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setError(null);
    setSuccess(null);

    if (name === 'image') {
      setImagePreviewUrl(value);
    }
    
    if (['price', 'originalPrice', 'productAmount'].includes(name)) {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setProductData({
        ...productData,
        [name]: numericValue,
      });
      return;
    }

    setProductData({
      ...productData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const generateTags = async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found in environment variables.');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Generate 10 relevant, single-word or two-word, comma-separated, lowercase English tags for a product. After the English tags, provide the direct Arabic translation for each of those 10 tags, also comma-separated. The final output must be a single string containing 20 comma-separated tags in total (10 English followed by their 10 Arabic translations).
      Example output format: tag1,tag2,tag3,ترجمة1,ترجمة2,ترجمة3
      Product Name: ${productData.name}
      Description: ${productData.description}
      Category: ${productData.category}
      Tags:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const generatedTags = text
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0);

      setProductData({ ...productData, tags: generatedTags });
    } catch (err) {
      console.error('Error generating tags:', err);
      setTagsError('Failed to generate tags. Check the console for details.');
    } finally {
      setTagsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!productData.name || !productData.price) {
      setError('Please fill in required fields: Name, and Price.');
      setLoading(false);
      return;
    }

    try {
      const productDataToSave = {
        ...productData,
        expiryDate: (productData.expiryDate && !isNaN(new Date(productData.expiryDate).getTime()))
          ? new Date(productData.expiryDate)
          : null,
        price: parseFloat(productData.price || '0'),
        originalPrice: parseFloat(productData.originalPrice || '0'),
        productAmount: parseInt(productData.productAmount || '0', 10),
        prescriptionRequired: false,
        createdAt: new Date(),
      };

      if (!userData?.uid) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      const userId = userData.uid;
      
      const docRef = await addDoc(collection(db, 'products'), productDataToSave);
      const newProductId = docRef.id;

      const productDataWithId = { ...productDataToSave, id: newProductId };
      await setDoc(doc(db, `users/${userId}/newproduct`, newProductId), productDataWithId);

      setSuccess('Product added successfully!');

      setProductData(prevData => ({
        name: '', description: '', price: '', originalPrice: '',
        image: '', images: [], category: '', brand: '', inStock: true, rating: 0,
        reviewCount: 0, deliveryTime: '90min', tags: [], productAmount: '',
        expiryDate: '', prescriptionRequired: false, pharmacyName: prevData.pharmacyName,
      }));
      setImagePreviewUrl('');

    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetUploadComplete = () => {
    setSuccess('Products uploaded successfully from Google Sheet!');
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          Add New Products
        </h2>
        <p className="text-center text-slate-500 mb-8">
          Add products manually or upload from Google Sheets
        </p>

        {/* Tab Navigation */}
        <div className="flex mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'sheet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 inline-block mr-2" />
            Google Sheets Upload
          </button>
        </div>

        {error && (
          <div className="flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative mb-6">
            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'manual' ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pharmacyName" className="block text-sm font-medium text-slate-700 mb-1">
                  Pharmacy Name
                </label>
                <input
                  type="text" name="pharmacyName" id="pharmacyName" value={productData.pharmacyName}
                  disabled className={disabledInputStyle.replace("mt-1 ", "")}
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Product Name*</label>
                <input type="text" name="name" id="name" value={productData.name} onChange={handleInputChange} required className={inputStyle} />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description" id="description" rows={8} value={productData.description}
                  onChange={handleInputChange}
                  className={inputStyle}
                ></textarea>
              </div>
            </div>
            
            <hr className="my-8 border-slate-200" />

            <h3 className="text-lg font-semibold text-slate-700 mb-4">Pricing & Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">Price*</label>
                <input type="text" inputMode="decimal" name="price" id="price" value={productData.price} onChange={handleInputChange} required className={inputStyle} />
              </div>
              <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-700 mb-1">Original Price</label>
                <input type="text" inputMode="decimal" name="originalPrice" id="originalPrice" value={productData.originalPrice} onChange={handleInputChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="productAmount" className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input type="text" inputMode="numeric" name="productAmount" id="productAmount" value={productData.productAmount} onChange={handleInputChange} className={inputStyle} />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center h-full">
                  <input
                    id="inStock" name="inStock" type="checkbox" checked={productData.inStock}
                    onChange={handleInputChange}
                    className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                  />
                  <label htmlFor="inStock" className="ml-2 block text-sm text-slate-800">
                    In Stock
                  </label>
                </div>
              </div>
            </div>

            <hr className="my-8 border-slate-200" />
            
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Categorization & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  name="category" id="category" value={productData.category}
                  onChange={handleInputChange} className={inputStyle}
                >
                  <option value="">Select a category</option>
                  <option value="Medications">Medications</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Vitamins">Vitamins</option>
                  <option value="Baby Care">Baby Care</option>
                  <option value="Pet Care">Pet Care</option>
                  <option value="Med-Devices">Med-Devices</option>
                </select>
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                <input type="text" name="brand" id="brand" value={productData.brand} onChange={handleInputChange} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-slate-700 mb-1">Delivery Time</label>
                <input type="text" name="deliveryTime" id="deliveryTime" value={productData.deliveryTime} disabled className={disabledInputStyle} />
              </div>
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                <input type="date" name="expiryDate" id="expiryDate" value={productData.expiryDate} onChange={handleInputChange} className={inputStyle} />
              </div>
            </div>

            <div className="mt-6 md:col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-slate-700 mb-1">Image URL*</label>
              <input type="text" name="image" id="image" value={productData.image} onChange={handleInputChange} required className={inputStyle} />
              
              <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-lg min-h-[12rem] flex justify-center items-center">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Preview" className="max-h-48 w-auto object-contain rounded-md" />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Image preview will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="my-8 border-slate-200" />
             
            <h3 className="text-lg font-semibold text-slate-700 mb-4">AI-Powered Tagging</h3>
            <div className="md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">Product Tags (English & Arabic)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text" name="tags" id="tags"
                  value={productData.tags.join(', ')}
                  onChange={(e) => setProductData({ ...productData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  className="flex-1 block w-full rounded-none rounded-l-lg border-2 border-r-0 border-blue-500 p-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
                  placeholder="Generate or enter comma-separated tags"
                />
                <button
                  type="button" onClick={generateTags}
                  disabled={tagsLoading || !productData.name || !productData.description}
                  className="relative inline-flex items-center px-4 py-2 rounded-r-md border-2 border-blue-500 border-l-0 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {tagsLoading ? (
                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" /> 
                  ) : (
                    <Wand2 className="-ml-1 mr-2 h-5 w-5" />
                  )}
                  <span>{tagsLoading ? 'Generating...' : 'Generate with AI'}</span>
                </button>
              </div>
              {tagsError && <p className="mt-2 text-sm text-red-600">{tagsError}</p>}
              {productData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {productData.tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Processing...
                  </>
                ) : (
                  'Add Product to Inventory'
                )}
              </button>
            </div>
          </form>
        ) : (
          <GoogleSheetUploader onUploadComplete={handleSheetUploadComplete} />
        )}
      </div>
    </div>
  );
};

export default AddProductPage;