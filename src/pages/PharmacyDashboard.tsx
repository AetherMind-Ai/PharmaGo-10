import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaPlusCircle, FaBox, FaUsers, FaChartLine, FaFileAlt, FaCog, FaBars, FaTimes, FaDollarSign, FaChartBar, FaRedo, FaListAlt, FaCoins, FaUserAlt, FaSignOutAlt, FaEye, FaStar } from 'react-icons/fa';
import { collection, query, where, getDocs, Timestamp, orderBy as firestoreOrderBy, limit as firestoreLimit } from 'firebase/firestore'; // Import Timestamp, orderBy, limit
import { db } from '../firebaseConfig';
import { Order } from '../types'; // Import Order type

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const PharmacyDashboard: React.FC = () => {
    const { user, userData, loading, signOutUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [profileViews, setProfileViews] = useState<number>(0);
    const [numberOfProducts, setNumberOfProducts] = useState<number>(0);
    const [totalReviews, setTotalReviews] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [salesToday, setSalesToday] = useState<number>(0); // New state for sales today
    const [recentOrders, setRecentOrders] = useState<Order[]>([]); // State for recent orders

    const handleSignOut = async () => {
        try {
            await signOutUser();
            navigate('/login');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const getAbbreviatedName = (name: string | undefined) => {
        if (!name) return 'Pharmacy';
        return name.split(' ').slice(0, 2).join(' ');
    };

    useEffect(() => {
        if (!loading && (!user || !userData || userData.role !== 'pharmacy')) {
            // Primary redirect logic is in ProtectedRoute, this is a fallback.
        }

        // Fetch profile views from userData when available
        if (userData && userData.pharmacyInfo && userData.pharmacyInfo.profileViews !== undefined) {
            setProfileViews(userData.pharmacyInfo.profileViews);
        }

        const fetchDashboardData = async () => {
            if (user && userData?.pharmacyInfo?.name && userData?.uid) {
                try {
                    const pharmacyName = userData.pharmacyInfo.name;
                    const pharmacyId = userData.uid;
                    
                    // Fetch products count
                    const productsRef = collection(db, 'products');
                    const productsQuery = query(productsRef, where('pharmacyName', '==', pharmacyName));
                    const productsSnapshot = await getDocs(productsQuery);
                    setNumberOfProducts(productsSnapshot.size);

                    // Fetch reviews/comments for this pharmacy's products
                    const commentsRef = collection(db, 'comments');
                    let totalRatingSum = 0;
                    let reviewCount = 0;

                    // Get all product IDs for this pharmacy
                    const productIds = productsSnapshot.docs.map(doc => doc.id);
                    
                    if (productIds.length > 0) {
                        // Fetch comments for all products (in batches if needed)
                        for (const productId of productIds) {
                            const commentsQuery = query(commentsRef, where('productId', '==', productId));
                            const commentsSnapshot = await getDocs(commentsQuery);
                            
                            commentsSnapshot.docs.forEach(doc => {
                                const commentData = doc.data();
                                if (typeof commentData.rating === 'number') {
                                    totalRatingSum += commentData.rating;
                                    reviewCount++;
                                }
                            });
                        }
                    }

                    setTotalReviews(reviewCount);
                    setAverageRating(reviewCount > 0 ? totalRatingSum / reviewCount : 0);

                    // Calculate Sales Today
                    let currentDaySales = 0;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Start of today

                    const ordersRef = collection(db, 'orders');
                    const salesQuery = query(
                        ordersRef,
                        where('pharmacyId', '==', pharmacyId),
                        where('status', '==', 'Shipped'),
                        where('shippedAt', '>=', today.toISOString()) // Filter by shipped date for today
                    );
                    const salesSnapshot = await getDocs(salesQuery);

                    salesSnapshot.forEach(doc => {
                        const order = doc.data() as Order;
                        // Sum product prices (without taxes) and delivery fees
                        const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        currentDaySales += itemsTotal + order.deliveryFee;
                    });
                    setSalesToday(currentDaySales);

                    // Fetch recent orders for the pharmacy
                    if (userData && userData.uid) {
                        const recentOrdersQuery = query(
                            ordersRef,
                            where('pharmacyId', '==', pharmacyId),
                            firestoreOrderBy('orderTimestamp', 'desc'),
                            firestoreLimit(5)
                        );
                        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
                        const fetchedRecentOrders: Order[] = recentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                        console.log('userData.uid:', userData.uid);
                        console.log('Fetched recent orders:', fetchedRecentOrders);
                        setRecentOrders(fetchedRecentOrders);
                    }

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                }
            }
        };

        fetchDashboardData();
    }, [user, userData, loading, navigate]);

    if (loading || !user || !userData) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const pharmacyInfo = userData.pharmacyInfo;

    // Chart Data
    const lineChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Sales (EGP)',
                data: [120, 190, 300, 500, 230, 340, 450],
                borderColor: 'rgb(74, 222, 128)',
                backgroundColor: 'rgba(74, 222, 128, 0.2)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const doughnutChartData = {
        labels: ['Medications', 'Skincare', 'Vitamins', 'Baby Care', 'Pet Care', 'Med-Devices'],
        datasets: [
            {
                label: 'Sales by Category',
                data: [300, 150, 100, 50, 75, 200],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                ],
                borderColor: '#fff',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const } }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Delivered': return 'bg-green-100 text-green-800'; // Changed from 'Completed' to 'Delivered'
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Shipped': return 'bg-blue-100 text-blue-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const NavLink: React.FC<{ to: string; icon: React.ReactElement; children: React.ReactNode; }> = ({ to, icon, children }) => {
        const isActive = location.pathname === to;
        return (
            <div onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(to, { replace: true });
            }} className={`flex items-center p-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200 cursor-pointer ${isActive ? 'bg-slate-900 text-white' : ''} ${!isSidebarOpen && 'justify-center'}`}>
                {React.cloneElement(icon, { className: `text-lg ${isSidebarOpen ? 'mr-4' : ''}` })}
                {isSidebarOpen && <span className="font-medium">{children}</span>}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <div className={`bg-slate-800 text-white shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-24'}`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700 h-20">
                    {isSidebarOpen && (
                        <div className="flex items-center">
                            {pharmacyInfo?.logoImage ? (
                                <img src={pharmacyInfo.logoImage} alt="Logo" className="w-10 h-10 rounded-full mr-3 object-cover" />
                            ) : (
                                <div className="w-10 h-10 bg-green-500 rounded-full mr-3 flex items-center justify-center font-bold">P</div>
                            )}
                            <h2 className="text-xl font-bold">{getAbbreviatedName(pharmacyInfo?.name)}</h2>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-slate-700 focus:outline-none">
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <nav className="flex-grow p-4 space-y-2 flex flex-col">
                    <NavLink to="/dashboard/pharmacy" icon={<FaTachometerAlt />}>Dashboard</NavLink>
                    <NavLink to="/dashboard/pharmacy/products" icon={<FaBox />}>Products</NavLink>
                    <NavLink to="/dashboard/pharmacy/new-product" icon={<FaPlusCircle />}>Add Product</NavLink>
                    <NavLink to="/dashboard/pharmacy/orders" icon={<FaListAlt />}>All Orders</NavLink> {/* New "All Orders" button */}
                    <NavLink to={`/profile/pharmacy/${user.uid}`} icon={<FaUserAlt />}>Profile</NavLink>
                    <NavLink to="/account" icon={<FaUserAlt />}>Account</NavLink>

                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className={`flex items-center p-3 w-full text-left text-red-400 hover:bg-red-700 hover:text-white rounded-lg transition-colors duration-200 ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <FaSignOutAlt className={`text-lg ${isSidebarOpen ? 'mr-4' : ''}`} />
                        {isSidebarOpen && <span className="font-medium">Sign Out</span>}
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-slate-600 font-medium hidden sm:block">{userData.fullName || userData.username || 'User'}</span>
                        {(userData.photoDataUrl || user.photoURL) ? (
                            <img src={userData.photoDataUrl || user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                                {userData.fullName ? userData.fullName.charAt(0) : user.email?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                </header>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Sales Today</p>
                            <p className="text-3xl font-bold text-slate-800">EGP {salesToday.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full"><FaCoins className="text-green-500 text-2xl" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Orders</p>
                            <p className="text-3xl font-bold text-slate-800">0</p> {/* This will need to be updated to fetch actual active orders */}
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full"><FaChartBar className="text-blue-500 text-2xl" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Products</p>
                            <p className="text-3xl font-bold text-slate-800">{numberOfProducts}</p>
                        </div>
                        <div className="bg-pink-100 p-3 rounded-full"><FaBox className="text-pink-500 text-2xl" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Profile Views</p>
                            <p className="text-3xl font-bold text-slate-800">{profileViews || '0'}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full"><FaEye className="text-purple-500 text-2xl" /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                            <p className="text-3xl font-bold text-slate-800">{averageRating.toFixed(1)}</p>
                            <p className="text-xs text-gray-500">({totalReviews} reviews)</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full"><FaStar className="text-yellow-500 text-2xl" /></div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Weekly Sales Trend</h3>
                        <div className="h-80 relative"><Line options={chartOptions} data={lineChartData} /></div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Sales by Category</h3>
                        <div className="h-80 relative"><Doughnut options={chartOptions} data={doughnutChartData} /></div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="p-3">Order ID</th>
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3 text-right">Total Amount</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-700">{order.id.substring(0, 8)}</td>
                                            <td className="p-3 text-slate-600">{order.fullName}</td>
                                            <td className="p-3 text-slate-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                                            <td className="p-3 text-right text-slate-600">EGP {order.totalPrice.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-3 text-center text-gray-500">No recent orders.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Sign Out Confirmation Pop-up */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
                        <p className="text-lg font-semibold mb-4 text-slate-800">Are you sure you want to sign out?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleSignOut}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
                            >
                                Agree
                            </button>
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="px-6 py-2 bg-gray-200 text-slate-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyDashboard;
