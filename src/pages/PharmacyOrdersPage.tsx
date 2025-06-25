import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Order } from '../types';
import { FaSpinner, FaBox, FaUser, FaMapMarkerAlt, FaPhone, FaCalendarAlt, FaMoneyBillWave, FaTruck, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PharmacyOrdersPage: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'Pharmacy')) {
      navigate('/login'); // Redirect if not logged in or not a pharmacy user
      return;
    }

    const fetchOrders = async () => {
      if (!user || !userData?.uid) {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('pharmacyId', '==', userData.uid),
          firestoreOrderBy('orderTimestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders: Order[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        console.log('userData.uid:', userData.uid);
        console.log('Fetched orders:', fetchedOrders);
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching pharmacy orders:', error);
        toast.error('Failed to load orders.');
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading && user && userData?.role === 'Pharmacy') {
      fetchOrders();
    }
  }, [user, userData, loading, navigate]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'Shipped' | 'Delivered' | 'Cancelled') => {
    if (!user || !userData?.uid) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: { status: 'Shipped' | 'Delivered' | 'Cancelled', shippedAt?: string } = { status: newStatus };

      if (newStatus === 'Shipped') {
        updateData.shippedAt = new Date().toISOString();
      }

      await updateDoc(orderRef, updateData);

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? ({ ...order, status: newStatus, ...(newStatus === 'Shipped' && { shippedAt: updateData.shippedAt }) } as Order)
            : order
        )
      );
      toast.success(`Order ${orderId.substring(0, 8)} marked as ${newStatus.toLowerCase()}!`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Shipped': return 'bg-blue-100 text-blue-800';
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!user || userData?.role !== 'Pharmacy') {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="bg-gray-100 min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pharmacy Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
            <p className="text-lg">No orders found for your pharmacy.</p>
            <p className="text-sm mt-2">Start selling products to see orders here!</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.fullName} ({order.userNumber})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.userAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc list-inside">
                        {order.items.map(item => (
                          <li key={item.id}>{item.name} (x{item.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      EGP {order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                          disabled={updatingOrderId === order.id}
                          className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50"
                          title="Mark as Shipped"
                        >
                          {updatingOrderId === order.id ? <FaSpinner className="animate-spin" /> : <FaTruck />}
                        </button>
                      )}
                      {order.status === 'Shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                          disabled={updatingOrderId === order.id}
                          className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                          title="Mark as Delivered"
                        >
                          {updatingOrderId === order.id ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                        </button>
                      )}
                      {(order.status === 'Pending' || order.status === 'Shipped') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                          disabled={updatingOrderId === order.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Cancel Order"
                        >
                          {updatingOrderId === order.id ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyOrdersPage;
