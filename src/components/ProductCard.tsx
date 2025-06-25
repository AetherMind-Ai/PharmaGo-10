import React from 'react';
import { Star, ShoppingCart, Truck, Clock, AlertCircle, Shield, Trash2 } from 'lucide-react'; // Added Trash2
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
// import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface ProductCardProps {
  product: Product;
  isListView?: boolean; // Optional prop for list view
  onDelete?: (productId: string) => void; // Optional prop for delete functionality
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isListView = false, onDelete }) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  // const navigate = useNavigate(); // Initialize useNavigate

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail page
    e.stopPropagation(); // Stop event propagation to the card link
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const renderRating = () => {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={star <= product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">({product.reviewCount})</span>
      </div>
    );
  };

  // const handleCardClick = () => {
  //   navigate(`/product/${product.id}`); // Navigate to product detail page
  // };

  return (
    <a
      href={`/product/${product.id}`} // Use anchor tag with href
      // target="_blank" // Open in new tab - REMOVED to open in same tab
      // rel="noopener noreferrer" // Security best practice - REMOVED
      className={`group cursor-pointer animate-scale-in ${isListView ? 'w-full' : ''}`}
      // onClick={handleCardClick} // Remove onClick handler
    >
      <div className={`card card-hover h-full overflow-hidden ${isListView ? 'flex flex-col sm:flex-row' : ''}`}>
        {/* Product Image */}
        <div className={`relative overflow-hidden ${isListView ? 'w-full sm:w-1/3 aspect-video sm:aspect-square' : 'aspect-square'}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {!product.inStock && (
              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                {t('outOfStock')}
              </span>
            )}
            {product.originalPrice && (
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
            {product.prescriptionRequired && (
              <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center space-x-1">
                <AlertCircle size={10} />
                <span>Rx</span>
              </span>
            )}
          </div>

          {/* Delivery Badge */}
          <div className="absolute top-3 right-3">
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
              product.deliveryTime === '90min' 
                ? 'bg-dark-blue text-white' 
                : 'bg-medium-blue text-white'
            }`}>
              {product.deliveryTime === '90min' ? <Truck size={12} /> : <Clock size={12} />}
              <span>{product.deliveryTime === '90min' ? t('expressDelivery') : t('scheduledDelivery')}</span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className={`p-6 ${isListView ? 'w-full sm:w-2/3 flex flex-col justify-between' : ''}`}>
          <div className="mb-3">
            <span className="text-xs text-dark-blue font-medium bg-light-blue/20 px-3 py-1 rounded-full">
              {product.brand}
            </span>
          </div>
          
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-dark-blue transition-colors">
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {renderRating()}

          {/* Price */}
          <div className="flex items-center space-x-3 my-4">
            <span className="text-2xl font-bold text-dark-blue">
              {product.price.toFixed(2)} EGP
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.originalPrice.toFixed(2)} EGP
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                product.inStock
                  ? 'btn-primary'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={16} />
              <span>{t('addToCart')}</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 bg-red-500 text-white hover:bg-red-600"
              >
                <Trash2 size={16} /> {/* Added Trash2 icon */}
                <span>{t('Delete Product')}</span>
              </button>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className={`flex items-center space-x-2 ${
              product.inStock ? 'text-green-600' : 'text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                product.inStock ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{product.inStock ? t('inStock') : t('outOfStock')}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Shield size={12} />
              <span className="text-xs">{product.category}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default ProductCard;
