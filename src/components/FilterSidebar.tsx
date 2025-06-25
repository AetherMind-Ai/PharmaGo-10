import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { FilterOptions, Product } from '../types'; // Import Product type
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebaseConfig'; // Import db
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange 
}) => {
  const { t, isRTL } = useLanguage();

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availablePharmacyNames, setAvailablePharmacyNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const productsCollectionRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsCollectionRef);
        const products: Product[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();
        const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();
        const uniquePharmacyNames = Array.from(new Set(products.map(p => p.pharmacyName).filter(Boolean) as string[])).sort();

        setAvailableBrands(uniqueBrands);
        setAvailableCategories(uniqueCategories);
        setAvailablePharmacyNames(uniquePharmacyNames);

      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Fallback to hardcoded values if Firestore fails
        setAvailableBrands(['Panadol', 'GlaxoSmithKline', 'Abbott', 'Novartis', 'Bayer', 'Pfizer', 'Sanofi', 'Roche']);
        setAvailableCategories(['Medications', 'Skin Care', 'Vitamins', 'Baby Care', 'Pet Care', 'Medical Devices']);
        setAvailablePharmacyNames([]); // No fallback for pharmacy names if not fetched
      }
    };

    fetchFilterOptions();
  }, []);

  const deliveryOptions = ['90min', 'scheduled'];

  const handlePriceRangeChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      priceRange: [min, max]
    });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    
    onFiltersChange({
      ...filters,
      brands: newBrands
    });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handlePharmacyNameToggle = (pharmacyName: string) => {
    const newPharmacyNames = filters.pharmacyNames.includes(pharmacyName)
      ? filters.pharmacyNames.filter(p => p !== pharmacyName)
      : [...filters.pharmacyNames, pharmacyName];
    
    onFiltersChange({
      ...filters,
      pharmacyNames: newPharmacyNames
    });
  };

  const handleDeliveryToggle = (delivery: string) => {
    const newDelivery = filters.deliveryTime.includes(delivery)
      ? filters.deliveryTime.filter(d => d !== delivery)
      : [...filters.deliveryTime, delivery];
    
    onFiltersChange({
      ...filters,
      deliveryTime: newDelivery
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [1, 10000],
      brands: [],
      categories: [],
      inStockOnly: false,
      deliveryTime: [],
      pharmacyNames: [], // Clear pharmacy names filter
      minRating: 0, // Reset minRating
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-[80px] ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-80px)] w-80 bg-white rounded-xl shadow-lg transform transition-transform duration-300 ease-in-out z-40 lg:transform-none lg:shadow-none lg:border-r lg:border-gray-200 ${
        isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 lg:p-8 h-full flex flex-col"> {/* Increased padding for better spacing, added flex-col */}
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200"> {/* Added bottom border */}
            <div className="flex items-center space-x-2">
              <Filter size={24} className="text-dark-blue" /> {/* Increased icon size */}
              <h3 className="text-xl font-bold text-gray-800">{t('filters')}</h3> {/* Larger, bolder title */}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllFilters}
                className="text-sm text-dark-blue hover:text-medium-blue transition-colors font-medium"
              >
                {t('clearFilters')}
              </button>
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-8 overflow-y-auto flex-1 pr-2"> {/* Increased space-y, flex-1 to take remaining height, added right padding for scrollbar */}
            {/* Price Range */}
            <div className="pb-6 border-b border-gray-100"> {/* Added bottom border for separation */}
              <h4 className="font-semibold text-lg text-gray-800 mb-4">{t('priceRange')}</h4> {/* Larger, bolder title */}
              <div className="space-y-4"> {/* Increased space-y */}
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(Number(e.target.value), filters.priceRange[1])}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-dark-blue focus:border-transparent transition-all duration-200"
                    placeholder="Min"
                    min="1"
                  />
                  <span className="text-gray-500 text-lg">-</span>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(filters.priceRange[0], Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-dark-blue focus:border-transparent transition-all duration-200"
                    placeholder="Max"
                    max="10000"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="10000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(filters.priceRange[0], Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-dark-blue"
                />
              </div>
            </div>

            {/* Brands */}
            <div className="pb-6 border-b border-gray-100">
              <h4 className="font-semibold text-lg text-gray-800 mb-4">{t('brand')}</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {availableBrands.map((brand) => (
                  <label key={brand} className="flex items-center space-x-3 cursor-pointer hover:text-dark-blue transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                    />
                    <span className="text-base text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="pb-6 border-b border-gray-100">
              <h4 className="font-semibold text-lg text-gray-800 mb-4">{t('category')}</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-3 cursor-pointer hover:text-dark-blue transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                    />
                    <span className="text-base text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pharmacy Names */}
            <div className="pb-6 border-b border-gray-100">
              <h4 className="font-semibold text-lg text-gray-800 mb-4">Pharmacy</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {availablePharmacyNames.map((pharmacyName) => (
                  <label key={pharmacyName} className="flex items-center space-x-3 cursor-pointer hover:text-dark-blue transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.pharmacyNames.includes(pharmacyName)}
                      onChange={() => handlePharmacyNameToggle(pharmacyName)}
                      className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                    />
                    <span className="text-base text-gray-700">{pharmacyName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="pb-6 border-b border-gray-100">
              <h4 className="font-semibold text-lg text-gray-800 mb-4">{t('availability')}</h4>
              <label className="flex items-center space-x-3 cursor-pointer hover:text-dark-blue transition-colors">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => onFiltersChange({ ...filters, inStockOnly: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                />
                <span className="text-base text-gray-700">{t('inStock')}</span>
              </label>
            </div>

            {/* Delivery Time */}
            <div className="pb-6 border-b border-gray-100">
              <h4 className="font-semibold text-lg text-gray-800 mb-4">{t('delivery')}</h4>
              <div className="space-y-3">
                {deliveryOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer hover:text-dark-blue transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.deliveryTime.includes(option)}
                      onChange={() => handleDeliveryToggle(option)}
                      className="h-5 w-5 rounded border-gray-300 text-dark-blue focus:ring-dark-blue transition-colors duration-200"
                    />
                    <span className="text-base text-gray-700">
                      {option === '90min' ? t('expressDelivery') : t('scheduledDelivery')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating section removed as per user request */}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
