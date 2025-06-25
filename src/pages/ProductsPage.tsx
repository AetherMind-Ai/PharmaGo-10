import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { Grid, List, ChevronLeft, ChevronRight, LayoutGrid, Package, Search } from 'lucide-react';
import { FilterOptions } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, limit, startAfter, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async'; // Import Helmet

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('query');
  const categoryQuery = searchParams.get('category');
  const pharmacyQuery = searchParams.get('pharmacy');

  const [products, setProducts] = useState<Product[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grid-2-col'>('grid');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const initialFilters: FilterOptions = {
      priceRange: [1, 10000], // Updated default price range
      brands: [],
      categories: [],
      inStockOnly: false,
      deliveryTime: [],
      minRating: 0,
      pharmacyNames: [],
    };

    if (categoryQuery) {
      initialFilters.categories = [categoryQuery];
    }
    if (pharmacyQuery) {
      initialFilters.pharmacyNames = [pharmacyQuery];
    }

    return initialFilters;
  });

  const productsPerPage = 24; // Number of products to fetch per load

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setProducts([]); // Clear products when filters change
    setLastVisible(null); // Reset lastVisible document
    setHasMore(true); // Assume there's more data with new filters
  };

  const fetchProducts = useCallback(async (loadMore: boolean = false) => {
    if (!loadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const productsCollectionRef = collection(db, 'products');
      let q = query(productsCollectionRef, orderBy('name'), limit(productsPerPage)); // Order by name for consistent pagination

      if (loadMore && lastVisible) {
        q = query(productsCollectionRef, orderBy('name'), startAfter(lastVisible), limit(productsPerPage));
      }

      const querySnapshot = await getDocs(q);
      const fetchedDocs = querySnapshot.docs;
      let fetchedProducts: Product[] = [];

      if (fetchedDocs.length === 0) {
        setHasMore(false);
        if (!loadMore) {
          setProducts([]);
        }
        return;
      }

      // Fetch reviews for each product
      for (const doc of fetchedDocs) {
        const data = doc.data();
        const product: Product = {
          id: doc.id,
          name: data.name || data.productName,
          description: data.description || '',
          price: data.price || 0,
          originalPrice: data.originalPrice || 0,
          image: data.image || data.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image',
          images: data.images || [],
          category: data.category || 'General',
          brand: data.brand || 'Unknown',
          inStock: data.inStock !== false,
          rating: 0,
          reviewCount: 0,
          deliveryTime: data.deliveryTime || '90min',
          tags: data.tags || [],
          prescriptionRequired: data.prescriptionRequired || false,
          pharmacyName: data.pharmacyName,
          productAmount: data.productAmount || data.quantity,
          expiryDate: data.expiryDate ? (data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate)) : null,
        };

        // Fetch comments/reviews for the current product
        const commentsCollectionRef = collection(db, 'comments');
        const commentsQuery = query(commentsCollectionRef, where('productId', '==', product.id));
        const commentsSnapshot = await getDocs(commentsQuery);

        let totalRating = 0;
        let reviewCount = 0;

        commentsSnapshot.docs.forEach(commentDoc => {
          const commentData = commentDoc.data();
          if (typeof commentData.rating === 'number') {
            totalRating += commentData.rating;
            reviewCount++;
          }
        });

        if (reviewCount > 0) {
          product.rating = totalRating / reviewCount;
          product.reviewCount = reviewCount;
        }

        fetchedProducts.push(product);
      }

      // Apply client-side search filter after fetching
      if (searchQuery) {
        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        fetchedProducts = fetchedProducts.filter(product =>
          product.name.toLowerCase().includes(lowerCaseSearchQuery) ||
          product.brand.toLowerCase().includes(lowerCaseSearchQuery) ||
          product.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchQuery)) ||
          (product.pharmacyName && product.pharmacyName.toLowerCase().includes(lowerCaseSearchQuery))
        );
      }

      // Apply sidebar filters
      if (filters.brands.length > 0) {
        fetchedProducts = fetchedProducts.filter(product => filters.brands.includes(product.brand));
      }
      if (filters.categories.length > 0) {
        fetchedProducts = fetchedProducts.filter(product => filters.categories.includes(product.category));
      }
      if (filters.inStockOnly) {
        fetchedProducts = fetchedProducts.filter(product => product.inStock);
      }
      if (filters.deliveryTime.length > 0) {
        fetchedProducts = fetchedProducts.filter(product => filters.deliveryTime.includes(product.deliveryTime));
      }
      if (filters.pharmacyNames.length > 0) {
        fetchedProducts = fetchedProducts.filter(product => product.pharmacyName && filters.pharmacyNames.includes(product.pharmacyName));
      }
      fetchedProducts = fetchedProducts.filter(product => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]);

      setProducts(prevProducts => loadMore ? [...prevProducts, ...fetchedProducts] : fetchedProducts);
      setLastVisible(fetchedDocs[fetchedDocs.length - 1]);
      setHasMore(fetchedDocs.length === productsPerPage); // If fewer than productsPerPage, no more data

    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, filters, categoryQuery, pharmacyQuery, lastVisible]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, searchQuery, filters, categoryQuery, pharmacyQuery]);

  const handleLoadMore = () => {
    fetchProducts(true);
  };

  // No longer need client-side pagination logic
  // const indexOfLastProduct = currentPage * productsPerPage;
  // const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  // const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  // const totalPages = Math.ceil(products.length / productsPerPage);
  // const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  // const renderPageNumbers = () => { ... }

  if (loading && products.length === 0) { // Only show full loading screen if no products are loaded yet
    return (
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-80 lg:flex-shrink-0 mb-8 lg:mb-0">
          <FilterSidebar 
            isOpen={true}
            onClose={() => {}}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
        <div className="flex-1 px-4 lg:pl-8 pt-[80px]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Package className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
              <p className="text-lg text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Products - PharmaGo</title>
        <meta name="description" content="Browse a wide range of products from various categories, brands, and pharmacies on PharmaGo." />
        <meta name="keywords" content="products, pharmacy, online pharmacy, medications, skincare, vitamins, baby care, pet care, medical devices, health, wellness" />
        <meta property="og:title" content="Products - PharmaGo" />
        <meta property="og:description" content="Browse a wide range of products from various categories, brands, and pharmacies on PharmaGo." />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Products - PharmaGo" />
        <meta name="twitter:description" content="Browse a wide range of products from various categories, brands, and pharmacies on PharmaGo." />
      </Helmet>
      <div className="flex flex-col lg:flex-row">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 mb-8 lg:mb-0">
          <FilterSidebar 
            isOpen={true}
            onClose={() => {}}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 lg:pl-8 pt-[80px]">
          {/* Header */}
          <div className="mb-6">
            {searchQuery && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Search Results for: "<span className="text-dark-blue">{searchQuery}</span>"
                </h1>
                <p className="text-gray-600">{products.length} products found</p>
              </div>
            )}
            {categoryQuery && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {categoryQuery} Products
                </h1>
                <p className="text-gray-600">{products.length} products in this category</p>
              </div>
            )}
            {pharmacyQuery && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Products from {pharmacyQuery}
                </h1>
                <p className="text-gray-600">{products.length} products available</p>
              </div>
            )}
          </div>

          {/* View Mode Toggles */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-dark-blue text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title="Grid View"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid-2-col')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid-2-col' ? 'bg-dark-blue text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title="2-Column Grid View"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-dark-blue text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title="List View"
              >
                <List size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {products.length} products
            </div>
          </div>

          {/* Product Grid/List */}
          {products.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : viewMode === 'grid-2-col' 
                  ? 'grid grid-cols-2 gap-6' 
                  : 'flex flex-col gap-6'
            }>
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isListView={viewMode === 'list'} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-dark-blue text-white rounded-lg hover:bg-medium-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading More...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
