import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // Keep useLocation for inner component
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'; // Added import
import TermsOfServicePage from './pages/TermsOfServicePage'; // Added import
import NumberInputPage from './pages/NumberInputPage'; // Added import
import RoleSelectionPage from './pages/RoleSelectionPage'; // Added import
import DeliveryDashboard from './pages/DeliveryDashboard'; // Added import
import DeliveryOrdersPage from './pages/DeliveryOrdersPage'; // Import DeliveryOrdersPage
import PharmacyDashboard from './pages/PharmacyDashboard'; // Added import
import ProductsPage from './pages/ProductsPage'; // Added import for ProductsPage
import Payup from './pages/Payup'; // Import Payup
import ProductDetailPage from './pages/ProductDetailPage'; // Import ProductDetailPage
import OrderPrescriptionPage from './pages/OrderPrescriptionPage'; // Import OrderPrescriptionPage
import VerifyPharmacyPage from './pages/VerifyPharmacyPage'; // Import VerifyPharmacyPage
import PharmacyInfoPage from './pages/PharmacyInfoPage'; // Import PharmacyInfoPage
import AddProductPage from './pages/AddProductPage'; // Import AddProductPage
import PharmacyOrdersPage from './pages/PharmacyOrdersPage'; // Import PharmacyOrdersPage
import PharmacyProductsPage from './pages/PharmacyProductsPage.tsx'; // Import PharmacyProductsPage
import { PharmacyProfilePage } from './pages/PharmacyProfilePage'; // Import PharmacyProfilePage
import CenterPage from './pages/CenterPage'; // Import CenterPage
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigate } from 'react-router-dom'; // Import Navigate
import { toast } from 'react-toastify'; // Import toast
import PharmacyLoginVerificationPage from './pages/PharmacyLoginVerificationPage'; // Import new page
import DeliveryInfoPage from './pages/DeliveryInfoPage'; // Import DeliveryInfoPage
import VerifyDeliveryPage from './pages/VerifyDeliveryPage'; // Import VerifyDeliveryPage
import DeliveryLoginPage from './pages/DeliveryLoginPage'; // Import DeliveryLoginPage
import ConfirmOrderPage from './pages/ConfirmOrderPage'; // Import ConfirmOrderPage

// Protected Route Component
const ProtectedRoute: React.FC<{ element: React.ReactElement; requiredRole?: string }> = ({ element, requiredRole }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but userData is still loading or not fetched, wait
  if (user && !userData && loading) {
    return null; // Or a loading spinner
  }

  if (requiredRole && userData?.role !== requiredRole) {
    // If user is logged in but doesn't have the required role, redirect to account
    return <Navigate to="/account" replace />;
  }

  return element;
};

// Specific Route for Pharmacy Verification Flow
const PharmacyVerificationRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but userData is still loading or not fetched, wait
  if (user && !userData && loading) {
    return null; // Or a loading spinner
  }

  if (userData?.role !== 'Pharmacy') { // Ensure role check is 'Pharmacy'
    return <Navigate to="/account" replace />; // Redirect non-pharmacy users
  }

  if (userData?.isPharmacyVerified) {
    return <Navigate to="/dashboard/pharmacy" replace />; // Redirect if already verified
  }

  return element;
};

// Specific Route for Delivery Verification Flow
const DeliveryVerificationRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user && !userData && loading) {
    return null; // Or a loading spinner
  }

  if (userData?.role !== 'delivery') {
    return <Navigate to="/account" replace />;
  }

  if (userData?.isDeliveryInfoComplete) {
    return <Navigate to="/delivery-dashboard" replace />;
  }

  return element;
};


// New component to wrap content inside Router
const AppContent: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation(); // useLocation is now inside Router context
  const hideHeader = location.pathname === '/login'; // Hide header on login page

  return (
    <LanguageProvider>
      <AuthProvider> {/* AuthProvider now wraps CartProvider */}
        <CartProvider>
          <div className="min-h-screen bg-white flex flex-col">
            {!hideHeader && <Header />}
            <main className="flex-grow">
              <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} /> {/* New route */}
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} /> {/* New route */}
                  <Route path="/number" element={<ProtectedRoute element={<NumberInputPage />} />} />
                  <Route path="/role" element={<ProtectedRoute element={<RoleSelectionPage />} />} />
                  <Route path="/dashboard/delivery" element={<ProtectedRoute element={<DeliveryDashboard />} requiredRole="delivery" />} /> {/* Protect Delivery Dashboard */}
                  <Route path="/delivery-orders" element={<ProtectedRoute element={<DeliveryOrdersPage />} requiredRole="Delivery" />} /> {/* New route for Delivery Orders Page */}
                  <Route path="/info-delivery" element={<ProtectedRoute element={<DeliveryInfoPage />} requiredRole="Delivery" />} /> {/* New route for Delivery Info Page */}
                  {/* Delivery Login Verification Page (for returning delivery personnel) */}
                  <Route path="/verify-delivery-login" element={<DeliveryVerificationRoute element={<VerifyDeliveryPage />} />} />
                  {/* New route for Delivery Admin Login */}
                  <Route path="/delivery-login" element={<DeliveryLoginPage />} />
                  {/* Protect the Pharmacy Dashboard route */}
                  <Route path="/dashboard/pharmacy" element={<ProtectedRoute element={<PharmacyDashboard />} requiredRole="Pharmacy" />} />
                  <Route path="/products" element={<ProductsPage />} /> {/* New route for products */}
                  <Route path="/product/:productId" element={<ProductDetailPage />} /> {/* Route for product detail page */}
                  <Route path="/checkout" element={<Payup />} /> {/* New route for Payup page */}
                  <Route path="/confirm-order" element={<ProtectedRoute element={<ConfirmOrderPage />} />} /> {/* New route for Confirm Order page */}
                  <Route path="/obp" element={<OrderPrescriptionPage />} /> {/* New route for Order by Prescription page */}
                  {/* Initial Pharmacy Verification (OTP generation and sending) */}
                  <Route path="/verify-pharmacy" element={<PharmacyVerificationRoute element={<VerifyPharmacyPage />} />} />
                  {/* Pharmacy Info Page (after initial verification) */}
                  <Route path="/info-pharmacy" element={<ProtectedRoute element={<PharmacyInfoPage />} requiredRole="Pharmacy" />} />
                  {/* Pharmacy Login Verification Page (for returning pharmacies) */}
                  <Route path="/account" element={<PharmacyVerificationRoute element={<PharmacyLoginVerificationPage />} />} />
                  {/* Protect Pharmacy related routes */}
                  <Route
                    path="/dashboard/pharmacy/new-product"
                    element={<ProtectedRoute element={<AddProductPage />} requiredRole="Pharmacy" />}
                  />
                   <Route
                    path="/dashboard/pharmacy/products"
                    element={<ProtectedRoute element={<PharmacyProductsPage />} requiredRole="Pharmacy" />}
                  />
                  <Route
                    path="/dashboard/pharmacy/orders"
                    element={<ProtectedRoute element={<PharmacyOrdersPage />} requiredRole="Pharmacy" />}
                  /> {/* New route for Pharmacy Orders Page */}
                  <Route path="/profile/pharmacy/:id" element={<PharmacyProfilePage />} /> {/* New route for Pharmacy Profile Page */}
                  <Route path="/center" element={<CenterPage />} /> {/* New route for Help Center Page */}
                </Routes>
              </main>
              <Footer />
            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          </div>
          <ToastContainer />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

function App() {
  return (
    <Router>
      <AppContent /> {/* Render the new component inside Router */}
    </Router>
  );
}

export default App;
