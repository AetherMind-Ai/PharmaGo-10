import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import emailjs from '@emailjs/browser';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { generateMTP } from '../utils/mtpGenerator';
import { Product, CartItem, UserData, Order, OrderProduct } from '../types';

const ConfirmOrderPage: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [mtpCode, setMtpCode] = useState('');
  const [mtpInput, setMtpInput] = useState('');
  const [isMtpSent, setIsMtpSent] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, userData } = useAuth();
  const { clearCart } = useCart();

  const orderDataFromState: Order | undefined = location.state?.orderData;

  useEffect(() => {
    if (orderDataFromState) {
      setOrderId(orderDataFromState.id);
    } else {
      // Generate a random 9-digit number
      const randomNineDigitNumber = Math.floor(100000000 + Math.random() * 900000000);
      setOrderId(`PGORD-${randomNineDigitNumber}`);
    }
  }, [orderDataFromState]);

  const handleGenerateMTP = async () => {
    if (!currentUser || !currentUser.email || !orderDataFromState) {
      setError('User email not available or order data missing. Please log in and try again from checkout.');
      return;
    }

    const generatedCode = generateMTP();
    setMtpCode(generatedCode);

    const templateParams = {
      to_name: currentUser.displayName || currentUser.email,
      order_id: orderDataFromState.id,
      orders: orderDataFromState.items.map((item: OrderProduct) => ({ // Corrected type to OrderProduct
        image_url: item.image,
        name: item.name,
        units: item.quantity,
        price: item.price,
      })),
      cost: {
        total: orderDataFromState.totalPrice,
      },
      mtp_code: generatedCode,
      email: currentUser.email,
    };

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRM_ORDER_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      setIsMtpSent(true);
      setError('');
    } catch (err) {
      console.error('Failed to send MTP email:', err);
      setError('Failed to send MTP. Please try again.');
    }
  };

  const handleConfirmOrder = async () => {
    if (mtpInput !== mtpCode) {
      setError('Invalid MTP code. Please try again.');
      return;
    }

    if (!currentUser || !userData || !orderDataFromState) {
      setError('User not logged in or user data/order data not available.');
      return;
    }

    try {
      const finalOrderData = {
        ...orderDataFromState,
        status: 'Confirmed',
        confirmedAt: serverTimestamp(),
        // Ensure optional fields are explicitly null if undefined
        uploadedImageLink: orderDataFromState.uploadedImageLink || null,
        doctorName: orderDataFromState.doctorName || null,
        clinicHospitalName: orderDataFromState.clinicHospitalName || null,
        prescriptionDate: orderDataFromState.prescriptionDate || null,
        prescriptionTime: orderDataFromState.prescriptionTime || null,
        manualProductList: orderDataFromState.manualProductList || null,
        notFoundMedicines: orderDataFromState.notFoundMedicines || null,
        consentToConfirm: orderDataFromState.consentToConfirm || false, // Assuming boolean, default to false
      };

      console.log('Final order data being saved to Firestore:', finalOrderData);
      console.log('pharmacyId:', finalOrderData.pharmacyId);
      console.log('orderTimestamp:', finalOrderData.orderTimestamp);
      await addDoc(collection(db, 'orders'), finalOrderData);
      setIsOrderConfirmed(true);
      clearCart();
      setError('');
    } catch (err) {
      console.error('Failed to save order:', err);
      setError('Failed to confirm order. Please try again.');
    }
  };

  if (!orderDataFromState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 text-lg mb-6">No order data found. Please go back to checkout to place an order.</p>
          <button
            onClick={() => navigate('/checkout')}
            className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Go to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (isOrderConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-green-600 mb-4">Order Confirmed!</h2>
          <p className="text-gray-700 text-lg mb-2">Your order <span className="font-semibold">{orderId}</span> has been successfully placed.</p>
          <p className="text-gray-600 mb-6">You will receive a confirmation email shortly.</p>
          <p className="text-red-500 text-sm font-semibold mt-4">Note: Orders cannot be cancelled after confirmation.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Confirm Your Order</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Order ID: <span className="text-green-600">{orderId}</span></h2>
          <p className="text-gray-600 text-sm">Please review your order details below.</p>
        </div>

        <div className="space-y-4 mb-6">
          {orderDataFromState.items.length === 0 ? (
            <p className="text-gray-500 text-center">No products in this order. Please go back to checkout.</p>
          ) : (
            orderDataFromState.items.map((item: OrderProduct) => ( // Corrected type to OrderProduct
              <div key={item.id} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="text-lg font-bold text-green-600">{item.price * item.quantity} EGP</p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between text-gray-700 text-lg mb-2">
            <span>Subtotal:</span>
            <span>{(orderDataFromState.totalPrice - orderDataFromState.deliveryFee - orderDataFromState.tax).toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-700 text-lg mb-2">
            <span>Shipping:</span>
            <span>{orderDataFromState.deliveryFee.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-700 text-lg mb-4">
            <span>Taxes:</span>
            <span>{orderDataFromState.tax.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-800 text-xl font-bold border-t-2 border-green-600 pt-4">
            <span>Order Total:</span>
            <span>{orderDataFromState.totalPrice.toFixed(2)} EGP</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          {!isMtpSent ? (
            <button
              onClick={handleGenerateMTP}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Generate MTP & Send Email
            </button>
          ) : (
            <div className="mt-4">
              <p className="text-green-600 mb-4">MTP sent to your email. Please enter it below to confirm.</p>
              <input
                type="text"
                value={mtpInput}
                onChange={(e) => setMtpInput(e.target.value)}
                placeholder="Enter MTP code"
                className="border border-gray-300 p-3 rounded-lg w-full max-w-xs text-center text-xl tracking-widest"
              />
              <button
                onClick={handleConfirmOrder}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Confirm Order
              </button>
            </div>
          )}
        </div>
        <p className="text-red-500 text-sm font-semibold mt-4 text-center">Note: Orders cannot be cancelled after confirmation.</p>
      </div>
    </div>
  );
};

export default ConfirmOrderPage;
