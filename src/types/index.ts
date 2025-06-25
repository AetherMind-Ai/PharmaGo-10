export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  deliveryTime: string; // Changed to string to accommodate various inputs
  tags: string[];
  prescriptionRequired?: boolean;
  pharmacyName?: string; // Added pharmacyName
  productAmount?: number; // Added productAmount
  expiryDate?: Date | null; // Added expiryDate, can be Date object or null
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string; // Added phoneNumber
  username?: string; // Added username
  fullName?: string; // Added fullName
  role?: string; // Added role
  photoDataUrl?: string; // Added photoDataUrl
  aboutMe?: string; // Added aboutMe
  isPharmacyVerified?: boolean; // Added flag for pharmacy verification status
  isPharmacyInfoComplete?: boolean; // Added flag for pharmacy info completion
  isDeliveryInfoComplete?: boolean; // Added flag for delivery info completion
  // Add pharmacyInfo for Pharmacy role
    pharmacyInfo?: {
      pharmacyId: string; // Added pharmacyId
      mtp?: string; // Added Master Transaction Password for pharmacy login
      name: string;
      vodafoneCash: string;
      address: string;
      mapLink: string;
      logoImage: string | null;
      pharmacyImages: Array<string | null>;
      coverPhoto?: string; // Added coverPhoto
      profileViews: number; // Added profileViews
    };
  // Add deliveryInfo for Delivery role
    deliveryInfo?: {
      companyName: string;
      companyId: string;
      mtp?: string; // Added Master Transaction Password for delivery login
      companyAddress: string;
      companyNumber: string;
      deliveryNumber: string;
      mapLink: string;
      companyImage: string | null;
      deliveryManImage: string | null;
      motorBikeId: string;
    };
  address?: { // Added address for general users
    line1: string;
    city: string;
    country: string;
    zipCode: string;
  };
}

export interface Comment {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productInStock: boolean;
  productBrand: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string; // Added userPhotoUrl
  text: string;
  rating: number;
  timestamp: Date;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  productCount: number;
  website: string;
  nationality: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export interface FilterOptions {
  priceRange: [number, number];
  brands: string[];
  categories: string[];
  inStockOnly: boolean;
  deliveryTime: string[];
  minRating: number;
  pharmacyNames: string[]; // Added pharmacyNames filter option
}

import { FieldValue } from 'firebase/firestore';

export interface Feedback {
  id: string;
  pharmacyId: string;
  userId: string | null; // null if anonymous
  userName: string; // "Anonymous" or user's name
  userPhotoUrl?: string;
  text: string;
  rating: number; // 1-5 stars
  timestamp: Date | FieldValue;
  images: string[]; // URLs of uploaded images
  reactions: { [emoji: string]: string[] }; // e.g., { "👍": ["uid1", "uid2"], "❤️": ["uid3"] }
  replies?: Reply[]; // Added replies array
}

export interface Reply {
  id: string;
  userId: string | null;
  userName: string;
  userPhotoUrl?: string;
  text: string;
  timestamp: Date | FieldValue;
  reactions?: { [emoji: string]: string[] }; // Reactions for replies, only thumbs up
}

export interface OrderProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  status?: string; // e.g., 'Available', 'Out of Stock'
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  userNumber: string;
  userAddress: string;
  userAddressMapLink: string | null;
  items: OrderProduct[];
  orderType: 'Prescription Order' | 'Direct Buy' | 'Cart Order';
  pharmacyId?: string; // ID of the pharmacy fulfilling the order
  pharmacyName?: string; // Name of the pharmacy fulfilling the order
  deliverymanId?: string; // ID of the delivery person assigned
  deliverymanName?: string; // Name of the delivery person assigned
  totalPrice: number;
  deliveryFee: number;
  tax: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string; // ISO string
  orderTimestamp: FieldValue;
  shippedAt?: string; // Added timestamp for when the order was shipped
  paymentMethod: 'vodafoneCash' | 'cashOnDelivery';
  // Prescription specific fields (optional)
  uploadedImageLink?: string | null;
  doctorName?: string;
  clinicHospitalName?: string;
  prescriptionDate?: string;
  prescriptionTime?: string;
  manualProductList?: string;
  notFoundMedicines?: string;
  consentToConfirm?: boolean;
}

export interface ProfileView {
  id: string;
  pharmacyId: string;
  timestamp: Date;
  userId: string | null; // null if anonymous, user's UID if logged in
}
