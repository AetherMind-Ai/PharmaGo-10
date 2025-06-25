import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { Search, Package, AlertCircle } from 'lucide-react';

const PharmacyProductsPage: React.FC = () => {
  const { userData, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPharmacyProducts = async () => {
      if (authLoading) {
        return;
      }

      if (!userData || !userData.uid || !userData.pharmacyInfo?.name) {
        setError("User not logged in or pharmacy information not available. Cannot fetch products.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const pharmacyName = userData.pharmacyInfo.name;
        const productsCollectionRef = collection(db, 'products');
        const q = query(productsCollectionRef, where('pharmacyName', '==', pharmacyName));
        const querySnapshot = await getDocs(q);

        const productsList: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsList.push({
            id: doc.id,
            name: data.name || data.productName,
            description: data.description,
            price: data.price,
            originalPrice: data.originalPrice,
            image: data.image || data.imageUrl,
            images: data.images || [],
            category: data.category,
            brand: data.brand,
            inStock: data.inStock !== false,
            rating: 0,
            reviewCount: 0,
            deliveryTime: data.deliveryTime || '90min',
            tags: data.tags || [],
            prescriptionRequired: data.prescriptionRequired || false,
            pharmacyName: data.pharmacyName,
            productAmount: data.productAmount || data.quantity,
            expiryDate: data.expiryDate ? (data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate)) : null,
          });
        });

        // Fetch comments for each product to calculate rating and reviewCount
        const productsWithReviews = await Promise.all(productsList.map(async (product) => {
          const commentsQuery = query(collection(db, 'comments'), where('productId', '==', product.id));
          const commentsSnapshot = await getDocs(commentsQuery);
          
          let totalRating = 0;
          let reviewCount = 0;

          commentsSnapshot.forEach((doc) => {
            const commentData = doc.data();
            totalRating += commentData.rating;
            reviewCount++;
          });

          const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

          return {
            ...product,
            rating: averageRating,
            reviewCount: reviewCount,
          };
        }));

        setProducts(productsWithReviews);
        setFilteredProducts(productsWithReviews);

      } catch (err) {
        console.error("Error fetching pharmacy products:", err);
        setError("Failed to fetch products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyProducts();
  }, [userData, authLoading]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const handleDeleteProduct = async (productId: string) => {
    if (!userData?.pharmacyInfo?.name) {
      setError("Pharmacy name not available. Cannot delete product.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const productDocRef = doc(db, 'products', productId);
      await deleteDoc(productDocRef);

      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      setFilteredProducts(prevProducts => prevProducts.filter(product => product.id !== productId));

      console.log(`Product with ID ${productId} deleted successfully.`);
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Products</h1>
              <p className="text-gray-600 mt-1">
                Manage and view all your pharmacy products
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/dashboard/pharmacy/new-product"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                Add New Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative"> {/* Removed max-w-md */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 && searchTerm !== '' ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        ) : filteredProducts.length === 0 && searchTerm === '' ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">Start building your inventory by adding your first product</p>
            <Link
              to="/dashboard/pharmacy/new-product"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-5 h-5 mr-2" />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onDelete={handleDeleteProduct} 
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyProductsPage;
