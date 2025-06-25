import React, { useState } from 'react';
import { Filter, Crown } from 'lucide-react'; // Added Crown icon
import HeroBanner from '../components/HeroBanner';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedBrands from '../components/FeaturedBrands';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import AIDoctor from '../components/AIDoctor';
import { mockProducts } from '../data/mockData';
import { FilterOptions } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    brands: [],
    categories: [],
    inStockOnly: false,
    deliveryTime: [],
    minRating: 0,
    pharmacyNames: []
  });

  // Filter products based on current filters
  const filteredProducts = mockProducts.filter(product => {
    const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
    const matchesBrand = filters.brands.length === 0 || filters.brands.includes(product.brand);
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);
    const matchesStock = !filters.inStockOnly || product.inStock;
    const matchesDelivery = filters.deliveryTime.length === 0 || filters.deliveryTime.includes(product.deliveryTime);
    const matchesRating = product.rating >= filters.minRating;

    return matchesPrice && matchesBrand && matchesCategory && matchesStock && matchesDelivery && matchesRating;
  });

  return (
    <div className="min-h-screen bg-cream">
      <HeroBanner />

      {/* Top Pharmacies Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-dark-blue"></div>
              <div className="p-3 bg-gradient-to-r from-light-blue to-medium-blue rounded-full">
                <Crown className="text-white w-6 h-6" />
              </div>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-dark-blue"></div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
              Top Pharmacies
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Discover the best pharmacies for all your healthcare needs
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Pharmacy Card 1 */}
            <a href="/profile/pharmacy/1" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 1 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy One
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
            {/* Pharmacy Card 2 */}
            <a href="/profile/pharmacy/2" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 2 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy Two
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
            {/* Pharmacy Card 3 */}
            <a href="/profile/pharmacy/3" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 3 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy Three
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
            {/* Pharmacy Card 4 */}
            <a href="/profile/pharmacy/4" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 4 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy Four
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
            {/* Pharmacy Card 5 */}
            <a href="/profile/pharmacy/5" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 5 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy Five
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
            {/* Pharmacy Card 6 */}
            <a href="/profile/pharmacy/6" className="group cursor-pointer transform hover:scale-105 transition-all duration-500 animate-scale-in">
              <div className="card card-hover overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Pharmacy 6 Logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-light-blue to-medium-blue rounded-full group-hover:from-medium-blue group-hover:to-dark-blue transition-all duration-300">
                      <Crown size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-dark-blue transition-colors">
                    Pharmacy Six
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
                    <span>Top Rated</span>
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <CategoryGrid />
      <FeaturedBrands className="hidden lg:block" />

      {/* Featured Products Section */}
      <section className="hidden lg:block py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Featured Products
            </h2>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden btn-outline flex items-center space-x-2"
            >
              <Filter size={16} />
              <span>{t('filters')}</span>
            </button>
          </div>

          <div className="flex">

            {/* Products Grid */}
            <div className="flex-1">
              <ProductGrid products={filteredProducts.length > 0 ? filteredProducts.slice(0, 15) : mockProducts.slice(0, 15)} />
            </div>
          </div>
        </div>
      </section>

      <AIDoctor />
    </div>
  );
};

export default HomePage;
