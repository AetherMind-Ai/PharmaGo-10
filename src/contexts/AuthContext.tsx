import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { useFirebase } from './FirebaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserData } from '../types';
import emailjs from '@emailjs/browser';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { generateMTP } from '../utils/mtpGenerator'; // Import generateMTP

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: (fullName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
  uploadProfilePicture: (file: File, user: User) => Promise<void>;
  verifyPharmacy: (pharmacyId: string, mtp: string) => Promise<boolean>;
  generatePharmacyCredentials: () => Promise<{pharmacyId: string, mtp: string} | null>;
  generateDeliveryCredentials: () => Promise<{deliverymanId: string, mtp: string} | null>;
  verifyDelivery: (deliverymanId: string, mtp: string) => Promise<boolean>;
  checkDuplicatePharmacy: (name: string, address: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
function generatePharmacyId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = 'PGP-';
  for (let i = 0; i < 11; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Helper function to generate a unique Delivery Company ID
function generatedeliverymanId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = 'PGD-'; // Changed prefix to PGD-
  for (let i = 0; i < 11; i++) { // 11 characters
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function extractUsername(email: string) {
  return email.split('@')[0];
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Firebase Auth user
  const [userData, setUserData] = useState<UserData | null>(null); // Firestore user data
  const [loading, setLoading] = useState(true);
  const { db, auth } = useFirebase(); // Get db and auth from FirebaseContext
  const navigate = useNavigate();
  const location = useLocation();
  const pendingFullName = useRef<string | null>(null); // Ref to store fullName

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        console.log('Attempting to fetch user document:', userDocRef.path);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData({ uid: currentUser.uid, ...userDocSnap.data() } as UserData);
          // Ensure photoDataUrl is updated from Google photoURL if available and different
          if (currentUser.photoURL && userDocSnap.data().photoDataUrl !== currentUser.photoURL) {
            await updateDoc(userDocRef, { photoDataUrl: currentUser.photoURL });
            setUserData(prevData => ({ ...prevData!, photoDataUrl: currentUser.photoURL! }));
          }
        } else {
          // If user exists in Auth but not Firestore, create a basic entry
          // This might happen if they signed in via Google but the Firestore doc wasn't created yet
          const initialUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            username: currentUser.email?.split('@')[0] || '',
            fullName: currentUser.displayName || pendingFullName.current || '', // Use displayName from Google or pendingFullName
            photoDataUrl: currentUser.photoURL || undefined, // Set photoDataUrl from Google photoURL
          };
          await setDoc(userDocRef, initialUserData);
          setUserData(initialUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to handle redirection based on user and userData state
  useEffect(() => {
    if (loading) {
      return;
    }

    if (user && userData) {
      const currentPath = location.pathname;

      // Prioritize staying on dashboard if profile is complete and already there
      if (userData.role === 'Pharmacy' && userData.isPharmacyVerified && userData.isPharmacyInfoComplete && currentPath.startsWith('/dashboard/pharmacy')) {
        return;
      }
      if (userData.role === 'Delivery' && userData.isDeliveryInfoComplete && currentPath.startsWith('/dashboard/delivery')) {
        return;
      }

      // Onboarding steps (prioritized if not on a dashboard)
      if (!userData.phoneNumber && currentPath !== '/number') {
        toast.info('Please complete your profile by adding a phone number.');
        navigate('/number');
        return;
      }

      if (userData.phoneNumber && !userData.role && currentPath !== '/role') {
        toast.info('Please select a role to continue.');
        navigate('/role');
        return;
      }

      // Role-specific onboarding/verification
      if (userData.role === 'Pharmacy') {
        if (!userData.isPharmacyVerified) {
          if (currentPath !== '/verify-pharmacy' && currentPath !== '/account') {
            if (userData.pharmacyInfo?.pharmacyId) {

              navigate('dashboard/pharmacy');
            } else {
              toast.info('Please verify your pharmacy account to continue.');
              navigate('/verify-pharmacy');
            }
            return;
          }
        } else if (!userData.isPharmacyInfoComplete) {
          if (currentPath !== '/info-pharmacy') {
            toast.info('Please complete your pharmacy profile.');
            navigate('/info-pharmacy');
            return;
          }
        }
      } else if (userData.role === 'Delivery') {
        if (!userData.isDeliveryInfoComplete && currentPath !== '/info-delivery') {
          toast.info('Please complete your delivery profile to continue.');
          navigate('/info-delivery');
          return;
        }
        // Removed specific redirect for /delivery-orders as it will be handled by DeliveryLoginPage itself
      }

      // General redirect for complete users on login/onboarding pages
      const isProfileFullyComplete = userData.phoneNumber && userData.role &&
        ((userData.role === 'Pharmacy' && userData.isPharmacyVerified && userData.isPharmacyInfoComplete) ||
         (userData.role === 'Delivery' && userData.isDeliveryInfoComplete) || // Removed isDeliveryAdminLoggedIn
         (userData.role === 'Client'));

      const isOnOnboardingPage = [
        '/login', '/number', '/role', '/info-pharmacy', '/verify-pharmacy',
        '/account', '/info-delivery'
      ].includes(currentPath);

      if (isProfileFullyComplete && isOnOnboardingPage) {
        navigate('/account');
        return;
      }

    } else if (!user &&
               location.pathname !== '/login' &&
               location.pathname !== '/' &&
               location.pathname !== '/terms-of-service' &&
               location.pathname !== '/privacy-policy') {
      navigate('/login');
    }
  }, [user, userData, loading, navigate, location.pathname]);

  const uploadProfilePicture = async (file: File, currentUser: FirebaseAuthUser) => {
    if (!currentUser || !currentUser.uid) {
      toast.error('You must be logged in to upload a profile picture.');
      throw new Error('User not authenticated.');
    }

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        if (dataUrl.length > 1024 * 1024) { // Check if Base64 string exceeds 1MB (Firestore limit)
          toast.error('Image is too large. Please select a smaller image.');
          reject(new Error('Image too large for Firestore document.'));
          return;
        }

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, { photoDataUrl: dataUrl });

          // Update local state
          setUserData(prevData => ({ ...prevData!, photoDataUrl: dataUrl }));
          toast.success('Profile picture uploaded successfully!');
          resolve();
        } catch (error: any) {
          console.error('Error saving photoDataUrl to Firestore:', error);
          toast.error(`Failed to save profile picture: ${error.message}`);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error('Failed to read image file.');
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const signInWithGoogle = async (fullName: string) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    // Optional: Force account selection
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      pendingFullName.current = fullName; // Store fullName before popup
      const result = await signInWithPopup(auth, provider);
      // The user object from result.user is the FirebaseAuthUser
      const currentUser = result.user;

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log('New user, creating document...');
          const initialUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            username: currentUser.email?.split('@')[0] || '',
            fullName: currentUser.displayName || pendingFullName.current || '', // Use displayName from Google or pendingFullName
            photoDataUrl: currentUser.photoURL || undefined, // Set photoDataUrl from Google photoURL
          };
          await setDoc(userDocRef, initialUserData);
          setUserData(initialUserData);
          toast.success('Account created successfully!');
          // New users will be redirected to phone number input by the useEffect
        } else {
          console.log('Existing user, loading and updating data...');
          const existingUserData = userDocSnap.data() as UserData;
          // Update fullName and photoDataUrl for existing user if they are different or were not set
          const updatedFullName = pendingFullName.current || existingUserData.fullName || currentUser.displayName || '';
          const updatedPhotoDataUrl = currentUser.photoURL || existingUserData.photoDataUrl || undefined;

          const updates: Partial<UserData> = {};
          if (updatedFullName !== existingUserData.fullName) {
            updates.fullName = updatedFullName;
          }
          if (updatedPhotoDataUrl !== existingUserData.photoDataUrl) {
            updates.photoDataUrl = updatedPhotoDataUrl;
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates); // Update in Firestore
            setUserData(prevData => ({ ...prevData!, ...updates }));
          } else {
            setUserData(existingUserData); // No updates needed, just set existing data
          }
          
          toast.success('Logged in successfully!');
          
          // Handle redirects for returning users based on their role and verification status
          if (existingUserData.role === 'Client') {
            // Client users go directly to account
            navigate('/account');
          } else if (existingUserData.role === 'Pharmacy' && existingUserData.isPharmacyVerified && existingUserData.isPharmacyInfoComplete) {
            // If pharmacy is already verified and info complete, go to dashboard
            navigate('/dashboard/pharmacy');
          } else if (existingUserData.role === 'Delivery' && existingUserData.isDeliveryInfoComplete) {
            // If delivery is already verified and info complete, go to dashboard
            navigate('/dashboard/delivery');
          }
          // Other cases (no role, no phone, unverified pharmacy/delivery) will be handled by the useEffect
        }
      }
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast.error(`Login failed: ${error.message}`);
      pendingFullName.current = null; // Clear the ref on error
    }
  };

  const signOutUser = async () => {
    try {
      if (user?.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef); // Fetch userDocSnap here

        // Only clear MTP on sign out, do not reset verification status
        const updateData: { [key: string]: any } = {};

        if (userDocSnap.exists() && userDocSnap.data()?.pharmacyInfo?.mtp) {
          updateData['pharmacyInfo.mtp'] = deleteField();
        }
        if (userDocSnap.exists() && userDocSnap.data()?.deliveryInfo?.mtp) {
          updateData['deliveryInfo.mtp'] = deleteField();
        }

        if (Object.keys(updateData).length > 0) {
          await updateDoc(userDocRef, updateData);

          // Update local state immediately for a smoother UX
          setUserData(prevData => {
            if (!prevData) return null;
            const newPrevData = { ...prevData };
            if (newPrevData.pharmacyInfo) {
              delete newPrevData.pharmacyInfo.mtp;
            }
            if (newPrevData.deliveryInfo) {
              delete newPrevData.deliveryInfo.mtp;
            }
            return newPrevData;
          });
        }
      }
      await signOut(auth);
      setUserData(null);
      setUser(null);
      toast.info('You have been logged out.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(`Sign out failed: ${error.message}`);
    }
  };

  const updateUserProfile = async (updates: Partial<UserData>) => {
    if (!user || !user.uid) {
      toast.error('You must be logged in to update your profile.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, updates);

      setUserData(prevData => ({ ...prevData!, ...updates }));
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  const updateUserRole = async (role: string) => {
    if (!user || !user.uid) {
      toast.error('You must be logged in to select a role.');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = { role };

      await updateDoc(userDocRef, updatedData);

      setUserData(prevData => ({ ...prevData!, ...updatedData }));
      
      toast.success(`Role set to ${role}!`);

      // Redirect based on role
      if (role === 'Client') {
        navigate('/account');
      } else if (role === 'Pharmacy') {
        navigate('/verify-pharmacy');
      } else if (role === 'Delivery') {
        navigate('/info-delivery');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    }
  };

  // Check if a pharmacy with the same name and address already exists
  const checkDuplicatePharmacy = async (name: string, address: string) => {
    try {
      // Query users collection for pharmacies with the same name and address
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'Pharmacy'),
        where('pharmacyInfo.name', '==', name),
        where('pharmacyInfo.address', '==', address)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If any documents match, a duplicate exists
      return !querySnapshot.empty;
    } catch (error: any) {
      console.error('Error checking for duplicate pharmacy:', error);
      toast.error(`Failed to check for duplicate pharmacy: ${error.message}`);
      return false; // Default to false on error
    }
  };

  // Generate pharmacy credentials (ID and MTP) and save to Firestore
  const generatePharmacyCredentials = async () => {
    if (!user || !user.email) {
      toast.error('User not authenticated or missing email.');
      return null;
    }

    try {
      const pharmacyId = generatePharmacyId();
      const mtp = generateMTP(); // Use generateMTP from the utility file

      // Save MTP directly to user's pharmacyInfo
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'pharmacyInfo.pharmacyId': pharmacyId,
        'pharmacyInfo.mtp': mtp, // Save MTP in pharmacyInfo
        isPharmacyVerified: false // Ensure it's false until verified
      });

      // Send MTP via EmailJS
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        toast.error('Email service not configured. Please check your .env file and EmailJS setup.');
        console.error('EmailJS environment variables are missing.');
        return null;
      }

      const templateParams = {
        email: user.email,
        to_name: userData?.fullName || extractUsername(user.email), // Use userData.fullName or extract from email
        mtp_code: mtp, // Send MTP as mtp_code
        user_role: userData?.role || 'Pharmacy', // Use userData.role or default to 'Pharmacy'
        pharmacy_id: pharmacyId,
        from_email: 'PharmaGo Team',
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast.success(`MTP sent to ${user.email}. Please check your inbox.`);

      return { pharmacyId, mtp };
    } catch (error: any) {
      console.error('Error generating pharmacy credentials:', error);
      toast.error(`Failed to generate credentials: ${error.message}`);
      return null;
    }
  };

  // Verify pharmacy with ID and MTP
  const verifyPharmacy = async (pharmacyId: string, mtp: string) => {
    if (!user || !user.uid) {
      toast.error('User not authenticated.');
      return false;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        toast.error('User data not found.');
        return false;
      }

      const currentUserData = userDocSnap.data() as UserData;
      const storedPharmacyId = currentUserData.pharmacyInfo?.pharmacyId;
      const storedMtp = currentUserData.pharmacyInfo?.mtp;

      // Check if the provided pharmacyId matches the stored one
      if (storedPharmacyId !== pharmacyId) {
        toast.error('Invalid Pharmacy ID. Please try again.');
        return false;
      }

      // Check if the provided MTP matches the stored one
      if (storedMtp !== mtp) {
        toast.error('Invalid MTP. Please try again.');
        return false;
      }

      // If both match, mark as verified and clear the MTP for security
      await updateDoc(userDocRef, {
        isPharmacyVerified: true,
        'pharmacyInfo.mtp': null // Clear MTP after successful verification
      });

      // Update local state
      setUserData(prevData => prevData ? { 
        ...prevData, 
        isPharmacyVerified: true,
        pharmacyInfo: prevData.pharmacyInfo ? { ...prevData.pharmacyInfo, mtp: undefined } : undefined
      } : null);

      toast.success('Pharmacy verified successfully!');
      return true;
    } catch (error: any) {
      console.error('Error verifying pharmacy:', error);
      toast.error(`Verification failed: ${error.message}`);
      return false;
    }
  };

  // Generate delivery credentials (ID and MTP) and save to Firestore
  const generateDeliveryCredentials = async () => {
    if (!user || !user.email) {
      toast.error('User not authenticated or missing email.');
      return null;
    }

    try {
      const deliverymanId = generatedeliverymanId();
      const mtp = generateMTP(); // Use generateMTP for MTP

      // Save MTP directly to user's deliveryInfo
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'deliveryInfo.companyId': deliverymanId,
        'deliveryInfo.mtp': mtp, // Save MTP in deliveryInfo
        isDeliveryInfoComplete: false // Ensure it's false until verified
      });

      // Send MTP via EmailJS
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        toast.error('Email service not configured. Please check your .env file and EmailJS setup.');
        console.error('EmailJS environment variables are missing.');
        return null;
      }

      const templateParams = {
        email: user.email,
        to_name: userData?.fullName || extractUsername(user.email), // Use userData.fullName or extract from email
        mtp_code: mtp, // Send MTP as mtp_code
        user_role: userData?.role || 'Delivery', // Use userData.role or default to 'Delivery'
        delivery_company_id: deliverymanId,
        from_email: 'The MedGo Team',
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast.success(`MTP sent to ${user.email}. Please check your inbox.`);

      return { deliverymanId, mtp };
    } catch (error: any) {
      console.error('Error generating delivery credentials:', error);
      toast.error(`Failed to generate credentials: ${error.message}`);
      return null;
    }
  };

  // Verify delivery with ID and MTP
  const verifyDelivery = async (deliverymanId: string, mtp: string) => {
    if (!user || !user.uid) {
      toast.error('User not authenticated.');
      return false;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        toast.error('User data not found.');
        return false;
      }

      const currentUserData = userDocSnap.data() as UserData;
      const storeddeliverymanId = currentUserData.deliveryInfo?.companyId;
      const storedMtp = currentUserData.deliveryInfo?.mtp;

      // Check if the provided deliverymanId matches the stored one
      if (storeddeliverymanId !== deliverymanId) {
        toast.error('Invalid Delivery Company ID. Please try again.');
        return false;
      }

      // Check if the provided MTP matches the stored one
      if (storedMtp !== mtp) {
        toast.error('Invalid MTP. Please try again.');
        return false;
      }

      // If both match, mark as verified and clear the MTP for security
      await updateDoc(userDocRef, {
        isDeliveryInfoComplete: true,
        'deliveryInfo.mtp': null // Clear MTP after successful verification
      });

      // Update local state
      setUserData(prevData => prevData ? { 
        ...prevData, 
        isDeliveryInfoComplete: true,
        deliveryInfo: prevData.deliveryInfo ? { ...prevData.deliveryInfo, mtp: undefined } : undefined
      } : null);

      toast.success('Delivery verified successfully!');
      return true;
    } catch (error: any) {
      console.error('Error verifying delivery:', error);
      toast.error(`Verification failed: ${error.message}`);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signInWithGoogle,
      signOutUser,
      updateUserProfile,
      updateUserRole,
      uploadProfilePicture,
      verifyPharmacy,
      generatePharmacyCredentials,
      checkDuplicatePharmacy,
      generateDeliveryCredentials, // Added for delivery
      verifyDelivery // Added for delivery
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
