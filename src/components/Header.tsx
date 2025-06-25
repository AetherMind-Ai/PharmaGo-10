import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, User, Globe, Heart, Menu, X, Plus, Minus, Trash2, FileText,
  Home, Pill, Sparkles, Dna, Baby, PawPrint, Syringe // Import new icons, added Syringe for Med-Devices
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig'; // Import db
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { Product } from '../types'; // Import Product type

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, isRTL } = useLanguage();
  const { getTotalItems, items: cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchableItems, setSearchableItems] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSearchableData = async () => {
      try {
        const productsCollectionRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsCollectionRef);
        const products: Product[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        const allNames = products.map(product => product.name);
        const allBrands = products.map(product => product.brand);
        const allTags = products.flatMap(product => product.tags || []); // Ensure tags is an array
        const allCategories = products.map(product => product.category);
        const allPharmacyNames = products.map(product => product.pharmacyName).filter(Boolean) as string[];

        const uniqueSearchableItems = Array.from(new Set([
          ...allNames,
          ...allBrands,
          ...allTags,
          ...allCategories,
          ...allPharmacyNames
        ]));
        setSearchableItems(uniqueSearchableItems);
      } catch (error) {
        console.error('Error fetching searchable data:', error);
        // Fallback to mock data or handle error gracefully if Firestore data fails
        // For now, we'll just log the error.
      }
    };

    fetchSearchableData();
  }, []);

  // Updated navigation items to use Lucide icons
  const navigationItems = [
    { key: 'medications', icon: <Pill size={20} />, label: 'Medications', category: 'Medications' },
    { key: 'skincare', icon: <Sparkles size={20} />, label: 'Skincare', category: 'Skincare' },
    { key: 'vitamins', icon: <Dna size={20} />, label: 'Vitamins', category: 'Vitamins' },
    { key: 'babycare', icon: <Baby size={20} />, label: 'Baby Care', category: 'Baby Care' },
    { key: 'petcare', icon: <PawPrint size={20} />, label: 'Pet Care', category: 'Pet Care' }, // Added Pet Care
    { key: 'meddevices', icon: <Syringe size={20} />, label: 'Med-Devices', category: 'Med-Devices' }, // Added Med-Devices
  ];

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const typeAndSearch = (text: string) => {
    setSearchQuery(''); // Clear current search query
    setShowSuggestions(false); // Hide suggestions during typing

    if (searchInputRef.current) {
      searchInputRef.current.focus(); // Focus the search input
    }

    let i = 0;
    const typeChar = () => {
      if (i < text.length) {
        setSearchQuery((prev) => prev + text.charAt(i));
        i++;
        setTimeout(typeChar, 100); // Typing speed (milliseconds per character)
      } else {
        // Ensure the full text is set in the search box after typing
        setSearchQuery(text); 
        // After typing, automatically search and navigate with a slight delay
        setTimeout(() => {
          navigate(`/products?query=${text}`);
          setIsMenuOpen(false); // Close mobile menu after navigation
        }, 200); // Small delay to ensure the full word is rendered before navigation
      }
    };

    typeChar(); // Start the typing animation from the first character
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        {/* Main Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
<img
  src="https://i.ibb.co/N6br8w1K/IMG-2493.png"
  alt="PharmaGo Logo"
  className="w-12 h-12 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300"
/>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">PharmaGo</h1>
                <p className="text-xs text-dark-blue font-medium tracking-wider">HEALTHCARE DELIVERED</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <div className="relative bg-white rounded-xl border-2 border-gray-200 focus-within:border-dark-blue transition-colors duration-200 shadow-sm">
                  <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 0) {
                        const query = e.target.value.toLowerCase();
                        const filtered = searchableItems.filter(item =>
                          item.toLowerCase().includes(query)
                        );
                        setFilteredSuggestions(filtered);
                        setShowSuggestions(true);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        typeAndSearch(searchQuery); // Use typeAndSearch
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="Search for products, brands, and more..."
                    className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none rounded-xl`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <button
                      className="btn-primary px-4 py-2 text-sm"
                      onClick={() => {
                        typeAndSearch(searchQuery); // Use typeAndSearch
                        setShowSuggestions(false);
                      }}
                    >
                      Search
                    </button>
                  </div>
                </div>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto z-50">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onMouseDown={() => {
                          typeAndSearch(suggestion); // Use typeAndSearch
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => navigate(user ? '/account' : '/login')}
                className="relative p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
              >
                <User size={24} className="text-dark-blue group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
              >
                <ShoppingCart size={24} className="text-dark-blue group-hover:scale-110 transition-transform" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* Functional Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
              >
                <Globe size={24} className="text-dark-blue group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-dark-blue uppercase">{language}</span>
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                {isMenuOpen ? <X size={24} className="text-red-500" /> : <Menu size={24} className="text-dark-blue" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`mt-6 ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
            {/* The justify-between class here pushes its direct children (the links div and the button) to opposite ends */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              
              {/* Left-aligned navigation links */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-3 md:space-y-0">
                <a href="/" className="text-dark-blue font-semibold hover:text-medium-blue transition-colors duration-300 flex items-center space-x-2 group">
                  <Home size={20} className="text-medium-blue" />
                  <span>Home</span>
                </a>
                {navigationItems.map((item) => (
                  <a
                    key={item.key}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default navigation
                      navigate(`/products?category=${item.category}`); // Navigate with category filter
                      setIsMenuOpen(false); // Close mobile menu after navigation
                    }}
                    className="text-dark-blue font-semibold hover:text-medium-blue transition-colors duration-300 flex items-center space-x-2 group cursor-pointer"
                  >
                    <span className="text-medium-blue group-hover:text-dark-blue transition-colors">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
              
              {/* Right-aligned "Order by Prescription" link */}
              <a href="/obp" className="bg-medium-blue text-white rounded-xl px-4 py-2 hover:bg-dark-blue transition-colors duration-300 flex items-center space-x-2 self-start md:self-center">
                <span>Order by Prescription</span>
                <FileText size={22} />
              </a>

            </div>
          </nav>
        </div>
      </header>
      
      {/* --- ANIMATED SIDEBAR CART --- */}
      <div className={`fixed inset-0 z-[9999] ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${isCartOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        <div className={`fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} rounded-l-2xl`}>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-2xl font-bold">Your Cart</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} className="text-gray-700 hover:text-red-500 hover:rotate-90 hover:scale-110 transition-all duration-200" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 pb-40">
            {cartItems.length === 0 ? (
              <p className="text-lg text-center mt-8 text-gray-500">Your cart is empty.</p>
            ) : (
              cartItems.map((item: any) => (
                <div key={item.product.id} className="border-b py-2 flex items-center space-x-4">
                  <img
                    src={item.product.image || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                  />
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{item.product.name}</p>
                    <p className="text-base text-gray-500">{item.product.brand}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} className="p-1 border rounded text-gray-500 hover:text-gray-700" aria-label="Decrease quantity">
                        <Minus size={16} />
                      </button>
                      <span className="text-lg">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 border rounded text-gray-500 hover:text-gray-700" aria-label="Increase quantity">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-red-500 hover:text-red-700" aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-dark-blue">
                    {(item.product.price * item.quantity).toFixed(2)} EGP
                  </p>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-bl-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-dark-blue">
                  {getTotalPrice().toFixed(2)} EGP
                </span>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="btn-primary w-full py-3 hover:scale-[1.02] transition-transform"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
