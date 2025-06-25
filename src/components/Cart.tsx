import React from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div
        className={`fixed top-[80px] bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-96 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-light-blue to-medium-blue text-white">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-semibold">Your Cart</h2>
            <span className="bg-white text-dark-blue px-2 py-1 rounded-full text-xs font-bold">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
              <button
                onClick={onClose}
                className="btn-primary mt-4"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.quantity}`} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.product.image || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{item.product.brand}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-dark-blue">
                          EGP {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className={`p-1 transition-colors border rounded ${
                          item.quantity <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-500 hover:text-gray-700 border-gray-300'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors border border-gray-300 rounded"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      EGP {item.product.price.toFixed(2)} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-800">Subtotal:</span>
              <span className="text-2xl font-bold text-dark-blue">
                EGP {getTotalPrice().toFixed(2)}
              </span>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleCheckout}
                className="btn-primary w-full py-3 hover:scale-[1.02] transition-transform"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={clearCart}
                className="btn-outline w-full py-2 text-red-500 hover:text-red-700 border-red-300 hover:border-red-500"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
