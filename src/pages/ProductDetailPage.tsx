import React, { useState, useEffect, MouseEvent, FormEvent, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link if needed later, keep for now
import { Product, Comment } from '../types'; // Keep Product and Comment types
import {
  FaStar as Star, // Use FaStar from react-icons/fa for consistency
  FaShoppingCart as ShoppingCart,
  FaTrashAlt as Trash2, // Use FaTrashAlt
  FaCreditCard as CreditCard // Use FaCreditCard
} from 'react-icons/fa'; // Import icons from react-icons/fa
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { db } from '../firebaseConfig'; // Import db
import { collection, query, where, orderBy, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore imports, add getDoc, updateDoc
import { toast } from 'react-toastify'; // Import toast
import ConfirmationDialog from '../components/ConfirmationDialog'; // Import ConfirmationDialog
import { Helmet } from 'react-helmet-async'; // Import Helmet

interface Params {
  productId: string;
  [key: string]: string | undefined;
}

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<Params>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; userId: string } | null>(null);

  // State for new comment form
  const { user, userData, loading: authLoading } = useAuth(); // Get user and userData from AuthContext
  const [newCommentText, setNewCommentText] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (userData?.username) {
      setNewUsername(userData.username);
    }
  }, [userData]);

  // MODIFIED: Refs for the new zoom logic
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Function to fetch comments from Firestore
  const fetchComments = useCallback(async () => {
    if (!productId) return;
    try {
      const commentsCollectionRef = collection(db, 'comments');
      const q = query(
        commentsCollectionRef,
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedComments: Comment[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp && typeof data.timestamp.toDate === 'function'
            ? data.timestamp.toDate()
            : data.timestamp || new Date(), // Safely convert Timestamp to Date, or use as is, or new Date() if missing
        } as Comment;
      });
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments.');
    }
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const productDocRef = doc(db, 'products', productId);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          const productData = productDocSnap.data();
          setProduct({
            id: productDocSnap.id,
            ...productData,
            expiryDate: productData.expiryDate && typeof productData.expiryDate.toDate === 'function'
              ? productData.expiryDate.toDate()
              : productData.expiryDate || null, // Safely convert Timestamp to Date, or use as is, or null
          } as Product);
        } else {
          // Product not found
          setProduct(undefined); // Or set a state to indicate not found
          toast.error('Product not found.');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details.');
      }
    };

    fetchProduct();
    fetchComments(); // Fetch comments on component mount or productId change
  }, [productId, fetchComments]); // Add fetchComments as a dependency

  // --- NEW AND IMPROVED ZOOM LOGIC ---
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const image = imageRef.current;

    // Calculate mouse position relative to the container
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    // Calculate mouse position as a percentage of the container's dimensions
    const xPercent = x / containerRect.width;
    const yPercent = y / containerRef.current.clientHeight; // Use container height

    const scale = 4; // Set zoom factor, increased for larger zoom

    // Apply the transformation directly for performance
    // This pans the image to keep the cursor's target in view
    image.style.transition = 'transform 0.1s ease-out'; // Fast transition for smooth panning
    image.style.transform = `translate(-${xPercent * (image.offsetWidth * scale - containerRef.current.clientWidth)}px, -${yPercent * (image.offsetHeight * scale - containerRef.current.clientHeight)}px) scale(${scale})`;
  };


  const handleMouseEnter = () => {
    if (!imageRef.current) return;
    // Set a delay for the initial zoom-in effect
    imageRef.current.style.transition = 'transform 0.3s 0.3s ease-in-out';
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    // Reset the image to its original state with no delay
    imageRef.current.style.transition = 'transform 0.3s ease-in-out';
    imageRef.current.style.transform = 'translate(0, 0) scale(1)';
  };
  // --- END OF ZOOM LOGIC ---

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      toast.error('Please log in to leave a comment.');
      navigate('/login');
      return;
    }
    if (newCommentText.trim() === '' || newRating === 0) {
      toast.error('Please fill in your comment and provide a rating.');
      return;
    }

    if (product) {
      try {
        const newComment: Omit<Comment, 'id'> = { // Omit 'id' as Firestore generates it
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productInStock: product.inStock,
          productBrand: product.brand,
          userId: user.uid,
          userName: userData.username || userData.fullName || 'Anonymous',
          userPhotoUrl: userData.photoDataUrl || user.photoURL || undefined,
          text: newCommentText,
          rating: newRating,
          timestamp: new Date(),
        };

        await addDoc(collection(db, 'comments'), newComment);
        toast.success('Comment submitted successfully!');
        setNewCommentText('');
        setNewRating(0);
        setHoverRating(0);
        await fetchComments(); // Re-fetch comments to update the list
        // After fetching comments, update the product's rating and reviewCount
        if (product) {
          const updatedComments = await getDocs(query(collection(db, 'comments'), where('productId', '==', product.id)));
          const totalRating = updatedComments.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
          const newReviewCount = updatedComments.docs.length;
          const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

          const productDocRef = doc(db, 'products', product.id);
          await updateDoc(productDocRef, {
            rating: newAverageRating,
            reviewCount: newReviewCount,
          });
          setProduct(prevProduct => prevProduct ? { ...prevProduct, rating: newAverageRating, reviewCount: newReviewCount } : undefined);
        }
      } catch (error) {
      }
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user || user.uid !== commentUserId) {
      toast.error('You can only delete your own comments.');
      return;
    }
    setCommentToDelete({ id: commentId, userId: commentUserId });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (commentToDelete) {
      try {
        await deleteDoc(doc(db, 'comments', commentToDelete.id));
        toast.success('Comment deleted successfully!');
        await fetchComments(); // Re-fetch comments to update the list
        // After fetching comments, update the product's rating and reviewCount
        if (product) {
          const updatedComments = await getDocs(query(collection(db, 'comments'), where('productId', '==', product.id)));
          const totalRating = updatedComments.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
          const newReviewCount = updatedComments.docs.length;
          const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

          const productDocRef = doc(db, 'products', product.id);
          await updateDoc(productDocRef, {
            rating: newAverageRating,
            reviewCount: newReviewCount,
          });
          setProduct(prevProduct => prevProduct ? { ...prevProduct, rating: newAverageRating, reviewCount: newReviewCount } : undefined);
        }
      } catch (error) {
      } finally {
        setShowDeleteConfirm(false);
        setCommentToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCommentToDelete(null);
  };


  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product) {
      addToCart(product);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      // Do NOT add to cart, navigate directly with product state
      navigate('/checkout', { state: { productToBuy: product } });
    }
  };

  const averageRating = comments.length > 0
    ? comments.reduce((acc, comment) => acc + comment.rating, 0) / comments.length
    : 0;
  const totalReviews = comments.length;

  if (!product || authLoading) { // Show loading if auth is still loading
    return <div className="pt-[80px] text-center">Loading product or user data...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - PharmaGo</title>
        <meta name="description" content={product.description} />
        <meta name="keywords" content={`${product.name}, ${product.brand}, ${product.category}, ${product.pharmacyName || ''}, ${product.tags?.join(', ') || ''}`} />
        <meta property="og:title" content={`${product.name} - PharmaGo`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - PharmaGo`} />
        <meta name="twitter:description" content={product.description} />
        <meta name="twitter:image" content={product.image} />
      </Helmet>
      <div className="container mx-auto px-4 py-8 pt-[80px]">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3">
            {/* MODIFIED: Zoom container with new event handlers */}
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-lg shadow-md cursor-zoom-in border w-full aspect-square"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={imageRef}
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover" // Make image fill the square container
              />
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl font-bold text-dark-blue">
                {product.price?.toFixed(2)} EGP
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice.toFixed(2)} EGP
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({totalReviews} reviews)</span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Details</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Additional Information</h2>
              <div className="text-gray-700 space-y-2">
                <p><span className="font-semibold">Category:</span> {product.category}</p>
                <p><span className="font-semibold">Brand:</span> {product.brand}</p>
                <p>
                  <span className="font-semibold">Availability:</span>{' '}
                  <span className={product.inStock ? 'text-green-600' : 'text-red-500'}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </p>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-gray-700">Tags:</span>
                    {product.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Display Pharmacy Name */}
                {product.pharmacyName && (
                  <p><span className="font-semibold">Pharmacy:</span> {product.pharmacyName}</p>
                )}
                {/* Display Product Amount */}
                {product.productAmount !== undefined && (
                  <p><span className="font-semibold">Amount:</span> {product.productAmount}</p>
                )}
                {/* Display Delivery Time */}
                {product.deliveryTime && (
                  <p><span className="font-semibold">Delivery Time:</span> {product.deliveryTime}</p>
                )}
                {/* Display Expiry Date */}
                {product.expiryDate && (
                  <p><span className="font-semibold">Expiry Date:</span> {product.expiryDate instanceof Date ? product.expiryDate.toLocaleDateString() : product.expiryDate}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className={`w-full flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-colors duration-300 ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <CreditCard size={20} />
                <span>Buy Now</span>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${product.inStock
                  ? 'btn-primary'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews & Comments</h2>

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={showDeleteConfirm}
            title="Delete Comment"
            message="Are you sure you want to delete this comment? This action cannot be undone."
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave a Review</h3>
            <form onSubmit={handleSubmitComment}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Your Name:</label>
                <input
                  type="text"
                  id="username"
                  className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-medium-blue"
                  placeholder="e.g. Ahmed Helmy"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={!!userData?.username} // Disable if username is already set
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Your Rating:</label>
                <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      className={`cursor-pointer transition-colors duration-200 ${star <= (hoverRating || newRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setNewRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-2">Your Comment:</label>
                <textarea
                  id="comment"
                  rows={4}
                  className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-medium-blue"
                  placeholder="Share your thoughts about the product..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-dark-blue hover:bg-medium-blue text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
                disabled={!user} // Disable submit if not logged in
              >
                Submit Review
              </button>
            </form>
            {!user && (
              <p className="text-sm text-red-500 mt-2">Please log in to submit a review.</p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto pr-4"> {/* Added max-height and overflow for scrolling */}
            {comments.length > 0 ? (
              comments
                .map((comment) => ( // Removed sort as Firestore query handles order
                  <div key={comment.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl overflow-hidden">
                          {comment.userPhotoUrl ? (
                            <img src={comment.userPhotoUrl} alt="User Avatar" className="w-full h-full object-cover" />
                          ) : (
                            comment.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{comment.userName}</p>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={16} className={star <= comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-xs text-gray-500 mb-2">
                          {comment.timestamp.toLocaleDateString()}
                        </p>
                        {user && user.uid === comment.userId && ( // Only show delete if current user owns comment
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.userId)}
                            className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-3 sm:pl-16">{comment.text}</p>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-500 py-4">Be the first to leave a review!</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
