import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Order } from '../types';
import { FaSpinner, FaCheckCircle, FaTruck, FaBox, FaUser, FaMapMarkerAlt, FaPhone, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DeliveryOrdersPage: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'Delivery')) {
      navigate('/login'); // Redirect if not logged in or not a delivery user
      return;
    }

    const fetchOrders = async () => {
      if (!user || !userData?.deliveryInfo?.companyId) {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        // Fetch orders that are 'Pending' and either unassigned or assigned to this deliveryman
        const q = query(
          ordersRef,
          where('status', 'in', ['Pending', 'Shipped']),
          orderBy('orderTimestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders: Order[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders.');
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading && user && userData?.role === 'Delivery') {
      fetchOrders();
    }
  }, [user, userData, loading, navigate]);

  const handleMarkAsShipped = async (orderId: string) => {
    if (!user || !userData?.deliveryInfo?.companyId || !userData?.fullName) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Shipped',
        deliverymanId: userData.uid,
        deliverymanName: userData.fullName,
        shippedAt: new Date().toISOString(), // Add a timestamp for when it was shipped
      });

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? ({ ...order, status: 'Shipped', deliverymanId: userData.uid, deliverymanName: userData.fullName, shippedAt: new Date().toISOString() } as Order)
            : order
        ).filter(order => order.status === 'Pending') // Remove shipped order from the list
      );
      toast.success('Order marked as shipped successfully!');
    } catch (error) {
      console.error('Error marking order as shipped:', error);
      toast.error('Failed to mark order as shipped.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!user || userData?.role !== 'Delivery') {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="bg-gray-100 min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Delivery Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
            <p className="text-lg">No pending orders for you at the moment.</p>
            <p className="text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</h2>
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 text-gray-700 flex-grow">
                  <p className="flex items-center"><FaUser className="mr-2 text-blue-500" /> <strong>Customer:</strong> {order.fullName}</p>
                  <p className="flex items-center"><FaPhone className="mr-2 text-blue-500" /> <strong>Phone:</strong> {order.userNumber}</p>
                  <p className="flex items-center"><FaMapMarkerAlt className="mr-2 text-blue-500" /> <strong>Address:</strong> {order.userAddress}</p>
                  {order.pharmacyName && (
                    <p className="flex items-center"><FaTruck className="mr-2 text-blue-500" /> <strong>From Pharmacy:</strong> {order.pharmacyName}</p>
                  )}
                  <p className="flex items-center"><FaCalendarAlt className="mr-2 text-blue-500" /> <strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                  <p className="flex items-center"><FaMoneyBillWave className="mr-2 text-blue-500" /> <strong>Total:</strong> EGP {order.totalPrice.toFixed(2)}</p>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center"><FaBox className="mr-2 text-blue-500" /> Items:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {order.items.map(item => (
                        <li key={item.id}>{item.name} (x{item.quantity}) - EGP {item.price.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleMarkAsShipped(order.id)}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingOrderId === order.id ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaCheckCircle className="mr-2" />
                    )}
                    Mark as Shipped
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;
