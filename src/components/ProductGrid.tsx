import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductGridProps {
  products: Product[];
  title?: string;
  showViewAll?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, title, showViewAll = false }) => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {title && (
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              {title}
            </h2>
            {showViewAll && (
              <button className="btn-primary">
                {t('viewAll')}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-5v2a1 1 0 01-1 1h-1m-1 0H9m3 0V9a1 1 0 011-1h1M6 7h3a1 1 0 011 1v1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
