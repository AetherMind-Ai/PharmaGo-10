import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../contexts/FirebaseContext'; // Import useFirebase
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore'; // Firestore imports
import { toast } from 'react-toastify'; // For pop-over notifications

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { db } = useFirebase(); // Get db from FirebaseContext

  // Effect to load cart from Firestore when user changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const cartCollectionRef = collection(db, `users/${user.uid}/cartItems`);
      const unsubscribe = onSnapshot(cartCollectionRef, (snapshot) => {
        const fetchedItems: CartItem[] = [];
        snapshot.forEach(doc => {
          fetchedItems.push(doc.data() as CartItem);
        });
        setItems(fetchedItems);
      }, (error) => {
        console.error('Error fetching cart from Firestore:', error);
        toast.error('Failed to load cart.');
        setItems([]);
      });

      return () => unsubscribe(); // Cleanup Firestore listener
    } else {
      setItems([]); // Clear cart if no user
    }
  }, [user, authLoading]);

  // No longer need a separate effect to save, as operations will directly update Firestore

  const addToCart = async (product: Product, quantity = 1) => {
    if (!user) {
      toast.error('Please log in to add items to cart.');
      return;
    }
    try {
      const cartItemRef = doc(db, `users/${user.uid}/cartItems`, product.id);
      const docSnap = await getDoc(cartItemRef);

      if (docSnap.exists()) {
        const existingQuantity = docSnap.data().quantity;
        await updateDoc(cartItemRef, { quantity: existingQuantity + quantity });
      } else {
        await setDoc(cartItemRef, { product, quantity });
      }
      toast.success('Added to cart successfully!', { position: 'bottom-left' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart.');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) {
      toast.error('Please log in to modify cart.');
      return;
    }
    try {
      await deleteDoc(doc(db, `users/${user.uid}/cartItems`, productId));
      toast.info('Item removed from cart.');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart.');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) {
      toast.error('Please log in to modify cart.');
      return;
    }
    if (quantity <= 0) {
      await removeFromCart(productId); // Use the async removeFromCart
      return;
    }
    try {
      const cartItemRef = doc(db, `users/${user.uid}/cartItems`, productId);
      await updateDoc(cartItemRef, { quantity });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity.');
    }
  };

  const clearCart = async () => {
    if (!user) {
      toast.error('Please log in to clear cart.');
      return;
    }
    try {
      const cartCollectionRef = collection(db, `users/${user.uid}/cartItems`);
      const snapshot = await getDocs(cartCollectionRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      toast.info('Cart cleared.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart.');
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
