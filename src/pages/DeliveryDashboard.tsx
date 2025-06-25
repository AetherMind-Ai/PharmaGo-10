import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Order } from '../types';
import { FaSpinner, FaCoins, FaTruck, FaChartBar, FaCheckCircle } from 'react-icons/fa';

const DeliveryDashboard: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [deliverySalesToday, setDeliverySalesToday] = useState<number>(0);
  const [activeDeliveries, setActiveDeliveries] = useState<number>(0);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'Delivery')) {
      navigate('/login'); // Redirect if not logged in or not a delivery user
      return;
    }

    const fetchDeliveryDashboardData = async () => {
      if (!user || !userData?.uid) {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        // Fetch sales for today (delivery fee from shipped orders)
        const salesQuery = query(
          ordersRef,
          where('deliverymanId', '==', userData.uid),
          where('status', '==', 'Shipped'),
          where('shippedAt', '>=', today.toISOString())
        );
        const salesSnapshot = await getDocs(salesQuery);
        let currentDayDeliverySales = 0;
        salesSnapshot.forEach(doc => {
          const order = doc.data() as Order;
          currentDayDeliverySales += order.deliveryFee; // Delivery company profit is the delivery fee
        });
        setDeliverySalesToday(currentDayDeliverySales);

        // Fetch active deliveries (orders assigned to this deliveryman and not yet 'Delivered' or 'Cancelled')
        const activeDeliveriesQuery = query(
          ordersRef,
          where('deliverymanId', '==', userData.uid),
          where('status', 'in', ['Pending', 'Shipped']) // Orders that are assigned and not yet completed/cancelled
        );
        const activeDeliveriesSnapshot = await getDocs(activeDeliveriesQuery);
        setActiveDeliveries(activeDeliveriesSnapshot.size);

      } catch (error) {
        console.error('Error fetching delivery dashboard data:', error);
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading && user && userData?.role === 'Delivery') {
      fetchDeliveryDashboardData();
    }
  }, [user, userData, loading, navigate]);

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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Delivery Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Sales Today Card */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sales Today (Profit)</p>
              <p className="text-3xl font-bold text-slate-800">EGP {deliverySalesToday.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full"><FaCoins className="text-green-500 text-2xl" /></div>
          </div>

          {/* Active Deliveries Card */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Deliveries</p>
              <p className="text-3xl font-bold text-slate-800">{activeDeliveries}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full"><FaTruck className="text-blue-500 text-2xl" /></div>
          </div>

          {/* Placeholder for other stats */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Delivered</p>
              <p className="text-3xl font-bold text-slate-800">0</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full"><FaCheckCircle className="text-purple-500 text-2xl" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Delivery Time</p>
              <p className="text-3xl font-bold text-slate-800">N/A</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full"><FaChartBar className="text-yellow-500 text-2xl" /></div>
          </div>
        </div>

        {/* TODO: Add charts and recent deliveries table */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          <p className="text-lg">More delivery statistics and recent orders will appear here.</p>
          <p className="text-sm mt-2">You can view pending orders on the <a href="/delivery-login" className="text-blue-600 hover:underline">Orders page</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
