import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, deleteDoc, orderBy, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserData, Product, Feedback, ProfileView, Reply } from '../types'; // Added Reply to imports
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
    FaMapMarkerAlt, FaPhone, FaGlobe, FaBox, FaBuilding, FaSpinner, FaArrowLeft,
    FaStar, FaClock, FaDollarSign, FaImage, FaInfoCircle, FaCheckCircle, FaChartLine,
    FaEye, FaPaperPlane, FaSmile, FaThumbsUp, FaHeart, FaLaugh, FaAngry, FaSadTear, FaCamera, FaTrash, FaRegTrashAlt, FaUpload, FaAt, FaSync
} from 'react-icons/fa'; // Added FaUpload, FaAt, FaSync
import { v4 as uuidv4 } from 'uuid';
import ImageModal from '../components/ImageModal';

export const PharmacyProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, userData }: { user: any; userData: UserData | null } = useAuth(); // Explicitly typing user and userData
    const [pharmacyData, setPharmacyData] = useState<UserData | null>(null);
    const [productCount, setProductCount] = useState<number>(0);
    const [profileViews, setProfileViews] = useState<number>(0);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileStatusMessage, setProfileStatusMessage] = useState<string | null>(null);

    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackImages, setFeedbackImages] = useState<string[]>([]); // Store Base64 strings
    const feedbackFileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Removed reply-related state as replying by text is no longer allowed
    const [showReactions, setShowReactions] = useState<{ [key: string]: boolean }>({});
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const reactionTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'feedback' | 'reply' | null; feedbackId: string | null; replyId?: string | null }>({ type: null, feedbackId: null, replyId: null });
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);

    // Refactor feedback fetching into a separate function
    const fetchFeedbacks = async (pharmacyId: string) => {
        const feedbacksRef = collection(db, 'feedback');
        const feedbackQuery = query(feedbacksRef, where('pharmacyId', '==', pharmacyId), orderBy('timestamp', 'desc'));
        return onSnapshot(feedbackQuery, (feedbackSnapshot) => {
            const fetchedFeedbacks: Feedback[] = feedbackSnapshot.docs.map(docSnap => {
                const feedbackData = docSnap.data();
                return {
                    id: docSnap.id,
                    ...feedbackData as Omit<Feedback, 'id' | 'timestamp'>,
                    timestamp: (feedbackData.timestamp?.toDate() || new Date()) as Date,
                    replies: [],
                };
            });
            setFeedbacks(fetchedFeedbacks);
        }, (error) => {
            console.error("Error fetching feedback (real-time):", error);
            toast.error("Failed to load reviews.");
        });
    };

    useEffect(() => {
        let unsubscribeFeedbacks: (() => void) | null = null;
        let unsubscribeProfileViews: (() => void) | null = null;

        const fetchInitialData = async () => {
            if (!id) {
                setProfileStatusMessage("Pharmacy ID is missing.");
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', id);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data() as UserData;
                    setPharmacyData(data);

                    if (data.role === 'pharmacy' && data.pharmacyInfo) {
                        setProfileStatusMessage(null);

                        // Fetch product count
                        const productsRef = collection(db, 'products');
                        const q = query(productsRef, where('pharmacyName', '==', data.pharmacyInfo.name));
                        const querySnapshot = await getDocs(q);
                        setProductCount(querySnapshot.size);

                        // Log profile view with transaction for atomic increment
                        let currentSessionId = localStorage.getItem('medgo_session_id');
                        if (!currentSessionId) {
                            currentSessionId = uuidv4();
                            localStorage.setItem('medgo_session_id', currentSessionId);
                        }
                        const profileViewsRef = collection(db, 'profileViews');
                        if (user?.uid || currentSessionId) {
                            // Create a deterministic ID for the view document to ensure uniqueness per user/session
                            const viewDocId = user?.uid ? `${id}_${user.uid}` : `${id}_${currentSessionId}`; // Simplified ID
                            const profileViewDocRef = doc(profileViewsRef, viewDocId);
                            const existingViewSnap = await getDoc(profileViewDocRef);

                            if (!existingViewSnap.exists()) {
                                // Store in global profileViews collection
                                await setDoc(profileViewDocRef, {
                                    pharmacyId: id,
                                    timestamp: serverTimestamp(),
                                    userId: user?.uid || null,
                                    sessionId: user?.uid ? null : currentSessionId,
                                });
                                // Atomically increment profileViews in user doc
                                await runTransaction(db, async (transaction) => {
                                    const userDoc = await transaction.get(userDocRef);
                                    if (!userDoc.exists()) return;
                                    const prevViews = userDoc.data().pharmacyInfo?.profileViews || 0;
                                    transaction.update(userDocRef, {
                                        'pharmacyInfo.profileViews': prevViews + 1
                                    });
                                    console.log("Profile view incremented for pharmacyId:", id, "New view count:", prevViews + 1);
                                    console.log("Profile view stored in Firestore for pharmacyId:", id, "User ID:", user?.uid || "Anonymous", "Session ID:", currentSessionId);
                                });
                            } else {
                                console.log("Profile view already recorded for pharmacyId:", id, "User ID:", user?.uid || "Anonymous", "Session ID:", currentSessionId);
                            }
                        }

                        // Setup real-time listeners after initial data fetch
                        unsubscribeProfileViews = onSnapshot(userDocRef, (docSnap) => {
                            const data = docSnap.data();
                            const updatedViews = data?.pharmacyInfo?.profileViews || 0;
                            console.log("Profile views updated via real-time listener for pharmacyId:", id, "Views:", updatedViews);
                            setProfileViews(updatedViews);
                            console.log("Current profileViews state after update:", updatedViews);
                        });

                        unsubscribeFeedbacks = await fetchFeedbacks(id); // Use the new function here

                    } else {
                        setProfileStatusMessage("This profile does not belong to a registered pharmacy or has incomplete information.");
                    }
                } else {
                    setProfileStatusMessage("Pharmacy not found.");
                }
            } catch (err) {
                console.error("Error fetching pharmacy data:", err);
                setProfileStatusMessage("Failed to load pharmacy profile due to a network error.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        return () => {
            if (unsubscribeFeedbacks) unsubscribeFeedbacks();
            if (unsubscribeProfileViews) unsubscribeProfileViews();
        };
    }, [id, user, userData]);

    const handleFeedbackImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFeedbackImages([reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFeedbackImage = () => {
        setFeedbackImages([]);
    };

    const handleLogoImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!id) {
            toast.error("Pharmacy ID is missing. Cannot upload logo.");
            return;
        }
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result as string;
                if (pharmacyData && user?.uid === id && userData?.role === 'pharmacy') {
                    setIsUploadingLogo(true);
                    try {
                        const userDocRef = doc(db, 'users', id);
                        await updateDoc(userDocRef, { 'pharmacyInfo.logoImage': base64Image });
                        setPharmacyData(prev => prev ? { ...prev, pharmacyInfo: { ...prev.pharmacyInfo!, logoImage: base64Image } } : null);
                        toast.success("Logo updated successfully!");
                    } catch (err) {
                        console.error("Error uploading logo:", err);
                        toast.error("Failed to upload logo.");
                    } finally {
                        setIsUploadingLogo(false);
                    }
                } else {
                    toast.error("You do not have permission to update this logo.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !feedbackText.trim() || feedbackRating === 0) {
            toast.error("Please provide text and a rating for your feedback.");
            return;
        }
        if (!user) {
            toast.error("Please log in to leave feedback.");
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            const newFeedback: Omit<Feedback, 'id'> = {
                pharmacyId: id,
                userId: user.uid,
                userName: user.displayName || userData?.fullName || "Anonymous",
                userPhotoUrl: user.photoURL || userData?.photoDataUrl || undefined,
                text: feedbackText.trim(),
                rating: feedbackRating,
                timestamp: serverTimestamp() as any,
                images: feedbackImages, // Base64 strings
                reactions: {},
            };

            const docRef = await addDoc(collection(db, 'feedback'), newFeedback);
            setFeedbacks(prev => [{ ...newFeedback, id: docRef.id, timestamp: new Date(), replies: [] }, ...prev]);
            toast.success("Feedback submitted successfully!");

            setFeedbackText('');
            setFeedbackRating(0);
            setFeedbackImages([]);
        } catch (err) {
            console.error("Error submitting feedback:", err);
            toast.error("Failed to submit feedback.");
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleReaction = async (targetId: string, emoji: string, type: 'feedback' | 'reply', replyId?: string) => {
        if (!user) {
            toast.error("Please log in to react.");
            return;
        }

        try {
            let docRef;
            let currentReactions: { [key: string]: string[] } = {};

            if (type === 'feedback') {
                docRef = doc(db, 'feedback', targetId);
            } else {
                if (!replyId) return;
                docRef = doc(db, 'feedback', targetId, 'replies', replyId);
            }
            
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                currentReactions = docSnap.data().reactions || {};
            }

            let updatedReactions = { ...currentReactions };
            const userHasReacted = Object.values(updatedReactions).some(uids => uids.includes(user.uid));

            // Remove user's previous reaction if it exists
            for (const key in updatedReactions) {
                updatedReactions[key] = updatedReactions[key].filter(uid => uid !== user.uid);
                if (updatedReactions[key].length === 0) delete updatedReactions[key];
            }

            // Add new reaction, or toggle off if it's the same emoji
            if (!userHasReacted || currentReactions[emoji]?.includes(user.uid) === false) {
                 updatedReactions[emoji] = [...(updatedReactions[emoji] || []), user.uid];
            }

            await updateDoc(docRef, { reactions: updatedReactions });

            console.log("Reaction updated successfully for", type, "ID:", targetId, "Reaction:", emoji, "User ID:", user.uid);

            setFeedbacks(prevFeedbacks => prevFeedbacks.map(fb => {
                if (fb.id === targetId) {
                    if (type === 'feedback') {
                        return { ...fb, reactions: updatedReactions };
                    } else if (type === 'reply' && fb.replies) {
                        return { ...fb, replies: fb.replies.map(rep => rep.id === replyId ? { ...rep, reactions: updatedReactions } : rep) };
                    }
                }
                return fb;
            }));

        } catch (err) {
            console.error("Error updating reaction:", err);
            toast.error("Failed to add reaction.");
        }
    };

    // Removed handleReplySubmit function as replying by text is no longer allowed
    
    const openDeleteConfirmation = (type: 'feedback', feedbackId: string) => {
        setItemToDelete({ type, feedbackId });
        setShowDeleteConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        if (!user) {
            toast.error("You must be logged in to delete content.");
            return;
        }
    
        const { type, feedbackId } = itemToDelete;
    
        if (type === 'feedback' && feedbackId) {
            const feedbackToDelete = feedbacks.find(fb => fb.id === feedbackId);
            if (feedbackToDelete?.userId !== user.uid) {
                toast.error("You can only delete your own feedback.");
                handleCancelDelete();
                return;
            }
            await deleteDoc(doc(db, 'feedback', feedbackId));
            setFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
            toast.success("Feedback deleted successfully!");
        }
        handleCancelDelete();
    };
    
    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
        setItemToDelete({ type: null, feedbackId: null, replyId: null });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
        );
    }
    
    // The check for !user || !userData was removed to allow public access.
    const pharmacyInfo = pharmacyData?.pharmacyInfo;
    const phoneNumber = pharmacyData?.phoneNumber;
    const role = pharmacyData?.role;
    const aboutMe = pharmacyData?.aboutMe;

    return (
        <div className="bg-gray-100 min-h-screen">
            {profileStatusMessage && !pharmacyInfo && (
                <div className="container mx-auto p-4">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">Profile Error</p>
                        <p>{profileStatusMessage}</p>
                    </div>
                </div>
            )}

            {/* Cover Photo and Profile Picture Section */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="relative h-64 md:h-96 rounded-b-lg overflow-hidden bg-gray-200">
                        <img
                            src={pharmacyInfo?.coverPhoto || 'https://i.ibb.co/1GsrsySF/cover.png'}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-24 md:-mt-16 px-4 pb-4">
                        <div className="relative w-40 h-40 rounded-full border-4 border-white shadow-lg group bg-gray-300">
                            <img
                                src={pharmacyInfo?.logoImage || 'https://via.placeholder.com/180'}
                                alt={`${pharmacyInfo?.name || 'Pharmacy'} Logo`}
                                className="w-full h-full object-cover rounded-full"
                            />
                            {user?.uid === id && userData?.role === 'pharmacy' && (
                                <div
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                    onClick={() => logoFileInputRef.current?.click()}
                                >
                                    {isUploadingLogo ? <FaSpinner className="animate-spin text-white text-2xl" /> : <FaUpload className="text-white text-2xl" />}
                                    <input type="file" ref={logoFileInputRef} onChange={handleLogoImageChange} accept="image/*" className="hidden" />
                                </div>
                            )}
                        </div>
                        <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{pharmacyInfo?.name || 'Pharmacy Profile'}</h1>
                            <p className="text-gray-600">{pharmacyInfo ? `Your Trusted Partner in Health` : 'Profile information not available'}</p>
                        </div>
                        {pharmacyInfo && (
                            <div className="flex-grow flex justify-center md:justify-end mt-4 md:mt-0 space-x-2">
                                <button onClick={() => navigate(`/products?pharmacy=${encodeURIComponent(pharmacyInfo.name)}`)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center">
                                    <FaBox className="mr-2" /> Products
                                </button>
                                {pharmacyInfo.vodafoneCash && (
                                    <a href={`https://wa.me/${pharmacyInfo.vodafoneCash}?text=Hello%20${encodeURIComponent(pharmacyInfo.name)}%2C%20I%20would%20like%20to%20message%20you%20about...`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition flex items-center">
                                        <FaPhone className="mr-2" /> WhatsApp
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {pharmacyInfo ? (
                <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Intro</h2>
                            <p className="text-gray-700 text-left mb-4">{aboutMe || `Welcome to ${pharmacyInfo.name}! We are dedicated to providing high-quality pharmaceutical products and excellent service.`}</p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center"><FaBuilding className="mr-3 text-gray-500" />{role}</li>
                                {pharmacyData?.username && (<li className="flex items-center"><FaAt className="mr-3 text-gray-500" />{pharmacyData.username}</li>)}
                                {pharmacyInfo.pharmacyId && (<li className="flex items-center"><FaInfoCircle className="mr-3 text-gray-500" />ID: {pharmacyInfo.pharmacyId}</li>)}
                                <li className="flex items-center"><FaMapMarkerAlt className="mr-3 text-gray-500" />{pharmacyInfo.address || 'Address not provided'}</li>
                                <li className="flex items-center"><FaPhone className="mr-3 text-gray-500" />{phoneNumber || 'N/A'}</li>
                                {pharmacyInfo.mapLink && (<li className="flex items-center"><FaGlobe className="mr-3 text-gray-500" /><a href={pharmacyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View on Map</a></li>)}
                            </ul>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Photos</h2>
                                <button onClick={() => setIsImageModalOpen(true)} className="text-blue-600 hover:underline">See all photos</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {pharmacyInfo.pharmacyImages && pharmacyInfo.pharmacyImages.slice(0, 4).map((img, index) => (img ? (<div key={index} className="relative w-full h-32 md:h-52 bg-gray-200 rounded-lg overflow-hidden shadow-sm group"><img src={img} alt={`Pharmacy ${index + 1}`} className="w-full h-full object-cover"/></div>) : null))}
                            </div>
                            {(!pharmacyInfo.pharmacyImages || pharmacyInfo.pharmacyImages.length === 0) && (<p className="text-gray-500 text-center py-4">No images available.</p>)}
                        </div>
                    </div>

                    {/* Main Content (Feedback) */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><FaChartLine className="mr-3 text-blue-600" /> Quick Stats</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                                <div className="flex items-center p-3 bg-gray-50 rounded-md"><FaStar className="mr-3 text-yellow-500 text-xl" /><div><span className="font-semibold">Avg. Rating:</span> {feedbacks.length > 0 ? (feedbacks.reduce((acc, fb) => acc + fb.rating, 0) / feedbacks.length).toFixed(1) : 'N/A'}<span className="text-sm text-gray-500 ml-1">({feedbacks.length})</span></div></div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-md"><FaBox className="mr-3 text-blue-500 text-xl" /><div><span className="font-semibold">Products:</span> {productCount}</div></div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                                    <FaEye className="mr-3 text-purple-500 text-xl" />
                                    <div>
                                        <span className="font-semibold">Profile Views:</span> {profileViews}
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-md"><FaClock className="mr-3 text-green-500 text-xl" /><div><span className="font-semibold">Est. Delivery:</span> 45 mins</div></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Leave a Review</h3>
                            <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                <textarea className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder={`Share your experience at ${pharmacyInfo.name}...`} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} required></textarea>
                                <div className="flex items-center"><span className="font-semibold text-gray-700 mr-3">Your Rating:</span>{[1, 2, 3, 4, 5].map((star) => (<FaStar key={star} className={`cursor-pointer text-2xl ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setFeedbackRating(star)}/>))}</div>
                                <div className="flex items-center"><input type="file" ref={feedbackFileInputRef} onChange={handleFeedbackImageSelect} accept="image/*" className="hidden" /><button type="button" onClick={() => feedbackFileInputRef.current?.click()} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center"><FaCamera className="mr-2" /> Add Photo</button>{feedbackImages.length > 0 && (<div className="relative ml-4 w-24 h-24"><img src={feedbackImages[0]} alt="preview" className="w-full h-full object-cover rounded-md" /><button type="button" onClick={removeFeedbackImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button></div>)}</div>
                                <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50" disabled={isSubmittingFeedback || !user}>{isSubmittingFeedback ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperPlane className="mr-2" />}{user ? "Submit Review" : "Login to Review"}</button>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg shadow-md">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                                {feedbacks.length > 0 ? (
                                    feedbacks.map((feedback, index) => (
                                        <div key={feedback.id} className={`p-6 ${index < 3 ? 'h-auto' : ''}`}>
                                            <div className="flex items-start">
                                                <img src={feedback.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(feedback.userName)}&background=random&color=fff&size=40`} alt={feedback.userName} className="w-10 h-10 rounded-full object-cover mr-4"/>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between"><p className="font-semibold text-gray-800">{feedback.userName}</p><div className="flex items-center text-yellow-400">{[1, 2, 3, 4, 5].map((star) => (<FaStar key={star} className={feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'}/>))}</div></div>
                                                    <span className="text-sm text-gray-500">{(feedback.timestamp as Date).toLocaleDateString()}</span>
                                                    <div className="flex justify-between items-start mt-2">
                                                        <p className="text-gray-700 whitespace-pre-wrap flex-1">{feedback.text}</p>
                                                        {user?.uid === feedback.userId && (<button onClick={() => openDeleteConfirmation('feedback', feedback.id)} className="ml-4 text-gray-500 hover:text-red-600 text-lg p-1 rounded-full"><FaRegTrashAlt /></button>)}
                                                    </div>
                                                    {feedback.images && feedback.images.length > 0 && (<div className="mt-3 flex flex-wrap gap-2">{feedback.images.map((img, imgIndex) => (<img key={imgIndex} src={img} alt={`Feedback ${imgIndex + 1}`} className="w-32 h-32 md:w-52 md:h-52 object-cover rounded-md border cursor-pointer" onClick={() => setIsImageModalOpen(true)}/>))}</div>)}
                                                    
                                                    <div className="mt-4 flex items-center space-x-4 text-gray-600">
                                                        <button className="flex items-center space-x-1 hover:text-blue-600 transition" onClick={() => handleReaction(feedback.id, '👍', 'feedback')}><FaThumbsUp className={feedback.reactions && feedback.reactions['👍']?.includes(user?.uid || '') ? 'text-blue-600' : ''}/><span>{feedback.reactions?.['👍']?.length || 0}</span></button>
                                                    </div>

                                                    {feedback.replies && feedback.replies.length > 0 && (<div className="mt-4 space-y-3 border-l-2 border-gray-200 pl-4">{feedback.replies.map((reply) => (<div key={reply.id} className="flex items-start"><img src={reply.userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.userName)}&background=random&color=fff&size=32`} alt={reply.userName} className="w-8 h-8 rounded-full object-cover mr-3"/><div className="flex-1 bg-gray-50 p-3 rounded-lg"><div className="flex items-center justify-between"><p className="font-semibold text-gray-800 text-sm">{reply.userName}</p></div><p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{reply.text}</p><div className="mt-2 flex items-center"><button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-600" onClick={() => handleReaction(feedback.id, '👍', 'reply', reply.id)}><FaThumbsUp className={reply.reactions && reply.reactions['👍']?.includes(user?.uid || '') ? 'text-blue-600' : ''}/><span>{reply.reactions?.['👍']?.length || 0}</span></button></div></div></div>))}</div>)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-6 text-center text-gray-500">No reviews yet. Be the first to leave one!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="container mx-auto p-4 text-center text-gray-600">
                    {!profileStatusMessage && <p className="text-lg">This profile does not have detailed pharmacy information.</p>}
                </div>
            )}

            <ImageModal
                images={
                    [
                        pharmacyInfo?.logoImage,
                        pharmacyInfo?.coverPhoto,
                        ...(pharmacyInfo?.pharmacyImages || []),
                        ...feedbacks.flatMap(fb => fb.images || [])
                    ].filter((img): img is string => !!img)
                }
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />

            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={handleCancelDelete} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">Continue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
