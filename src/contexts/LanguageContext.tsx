import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    search: 'Search medicines, health products...',
    login: 'Login',
    cart: 'Cart',
    profile: 'Profile',
    logout: 'Logout',
    
    // Navigation
    home: 'Home',
    medications: 'Medications',
    skincare: 'Skin Care',
    vitamins: 'Vitamins',
    babycare: 'Baby Care',
    petcare: 'Pet Care',
    
    // Home page
    heroTitle: 'Your Health, Our Priority',
    heroSubtitle: 'Get medicines and health products delivered in 90 minutes',
    shopNow: 'Shop Now',
    askDoctor: 'Ask AI Doctor',
    
    // Categories
    topCategories: 'Top Categories',
    viewAll: 'View All',
    
    // Brands
    topBrands: 'Top Medical Brands We Trust',
    viewProducts: 'View Products',
    
    // Products
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    expressDelivery: '90-min Express',
    scheduledDelivery: 'Scheduled',
    prescriptionRequired: 'Prescription Required',
    
    // Filters
    filters: 'Filters',
    priceRange: 'Price Range',
    brand: 'Brand',
    category: 'Category',
    availability: 'Availability',
    delivery: 'Delivery Time',
    rating: 'Rating',
    clearFilters: 'Clear All',
    
    // AI Doctor
    aiDoctor: 'AI Doctor',
    askQuestion: 'Ask your health question...',
    send: 'Send',
    disclaimer: 'AI responses are for informational purposes only. Consult a real doctor for medical advice.',
    
    // Cart
    cartEmpty: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    checkout: 'Checkout',
    total: 'Total',
    
    // Auth
    signInWithGoogle: 'Sign in with Google',
    welcome: 'Welcome back',
  },
  ar: {
    // Header
    search: 'البحث عن الأدوية والمنتجات الصحية...',
    login: 'تسجيل الدخول',
    cart: 'السلة',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    
    // Navigation
    home: 'الرئيسية',
    medications: 'الأدوية',
    skincare: 'العناية بالبشرة',
    vitamins: 'الفيتامينات',
    babycare: 'عناية الطفل',
    petcare: 'عناية الحيوانات',
    
    // Home page
    heroTitle: 'صحتك، أولويتنا',
    heroSubtitle: 'احصل على الأدوية والمنتجات الصحية خلال 90 دقيقة',
    shopNow: 'تسوق الآن',
    askDoctor: 'اسأل الطبيب الذكي',
    
    // Categories
    topCategories: 'أهم الفئات',
    viewAll: 'عرض الكل',
    
    // Brands
    topBrands: 'أفضل العلامات الطبية التي نثق بها',
    viewProducts: 'عرض المنتجات',
    
    // Products
    addToCart: 'أضف للسلة',
    buyNow: 'اشترِ الآن',
    inStock: 'متوفر',
    outOfStock: 'غير متوفر',
    expressDelivery: 'توصيل سريع 90 دقيقة',
    scheduledDelivery: 'توصيل مجدول',
    prescriptionRequired: 'يتطلب وصفة طبية',
    
    // Filters
    filters: 'الفلاتر',
    priceRange: 'نطاق السعر',
    brand: 'العلامة التجارية',
    category: 'الفئة',
    availability: 'التوفر',
    delivery: 'وقت التوصيل',
    rating: 'التقييم',
    clearFilters: 'مسح الكل',
    
    // AI Doctor
    aiDoctor: 'الطبيب الذكي',
    askQuestion: 'اسأل سؤالك الصحي...',
    send: 'إرسال',
    disclaimer: 'إجابات الذكاء الاصطناعي لأغراض إعلامية فقط. استشر طبيبًا حقيقيًا للنصائح الطبية.',
    
    // Cart
    cartEmpty: 'سلة التسوق فارغة',
    continueShopping: 'متابعة التسوق',
    checkout: 'الدفع',
    total: 'المجموع',
    
    // Auth
    signInWithGoogle: 'تسجيل الدخول بجوجل',
    welcome: 'مرحباً بعودتك',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};