import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Plugin for GitHub Flavored Markdown

// --- ICON IMPORTS from lucide-react ---
// Icons are chosen to match the privacy-related topics.
import {
  ShieldCheck,
  ClipboardList,
  Cog,
  Share2,
  Lock,
  UserCheck,
  BellRing,
  Mail,
  CalendarDays,
} from 'lucide-react';

// --- DATA: Content stored as Markdown for easy updates ---
const privacyContent = [
  {
    icon: ShieldCheck,
    title: "1. Introduction",
    content: `Welcome to **PharmaGo**! We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy describes how we collect, use, process, and disclose your information when you use our mobile application and website (collectively, the "Service").`,
  },
  {
    icon: ClipboardList,
    title: "2. Information We Collect",
    content: `We collect various types of information to provide and improve our Service to you:

### Personal Information You Provide:
*   **Account Information:** Your name, email address, phone number, and role.
*   **Profile Information:** Full name, username, profile picture, and description.
*   **Pharmacy Information:** Pharmacy name, address, map link, Vodafone Cash number, and images.
*   **Order Information:** Product details, delivery address, and payment information.
*   **Feedback and Reviews:** Content you submit, including text, ratings, and images.
*   **Communications:** Records of your communications with us.

### Information Collected Automatically:
*   **Usage Data:** How you access and use the Service.
*   **Device Information:** IP address, device type, and operating system.
*   **Location Information:** Precise or approximate location if you enable location services.
*   **Cookies:** We use cookies and similar technologies to track activity.`
  },
  {
    icon: Cog,
    title: "3. How We Use Your Information",
    content: `We use the information we collect for various purposes, including:
    
*   To provide, operate, and maintain our Service.
*   To process your orders and manage your account.
*   To improve, personalize, and expand our Service.
*   To develop new products, services, features, and functionality.
*   To communicate with you for updates, customer service, and marketing.
*   To detect and prevent fraud and comply with legal obligations.`
  },
  {
    icon: ClipboardList, // Reusing an icon, or could import a new one like 'XCircle'
    title: "4. Order Cancellation Policy",
    content: `Please note that once an order has been confirmed and processed, it **cannot be cancelled** by the user through the application. All sales are final after confirmation. If you have an urgent issue with a confirmed order, please contact our customer support immediately for assistance.`,
  },
  {
    icon: Share2,
    title: "5. How We Share Your Information",
    content: `We may share your information with third parties in these situations:
    
*   **With Service Providers:** For payment processing, data analysis, and hosting.
*   **With Pharmacies and Delivery Partners:** To fulfill your order.
*   **For Business Transfers:** During a merger, acquisition, or asset sale.
*   **For Legal Reasons:** If required by law or a valid public authority request.
*   **With Your Consent:** For any other purpose with your explicit consent.`
  },
  {
    icon: Lock,
    title: "6. Data Security",
    content: `We implement reasonable security measures designed to protect your personal information from unauthorized access, use, alteration, and disclosure. However, no method of transmission over the Internet or method of electronic storage is 100% secure.`,
  },
  {
    icon: UserCheck,
    title: "7. Your Data Protection Rights",
    content: `Depending on your location, you may have the right to:
    
*   Access, update, or delete the information we have on you.
*   Rectify any inaccurate information.
*   Object to our processing of your personal data.
*   Request that we restrict processing.
*   Data portability.
*   Withdraw consent at any time.
    
To exercise these rights, please contact us.`
  },
  {
    icon: BellRing,
    title: "8. Changes to This Privacy Policy",
    content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. You are advised to review this page periodically for any changes.`,
  },
  {
    icon: Mail,
    title: "9. Contact Us",
    content: `If you have any questions about this Privacy Policy, please contact us:
    
*   **By email:** pharmago.help@gmail.com
*   **By phone:** +20 122 791 9119`
  },
];


// --- SUB-COMPONENTS (Styled with your custom theme) ---

const PageHeader: React.FC = () => (
  <div className="text-center mb-16">
    <div className="inline-block p-4 mb-6 bg-primary-100 rounded-full animate-float">
      <ShieldCheck className="h-12 w-12 text-primary-600" />
    </div>
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
      Privacy Policy
    </h1>
    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
      Your privacy is important to us. This policy explains what information we collect and how we use it.
    </p>
  </div>
);

const EffectiveDateBox: React.FC<{ date: string }> = ({ date }) => (
  <div className="flex items-center gap-4 mb-12 p-4 bg-primary-50 border border-primary-200 rounded-lg">
    <CalendarDays className="h-8 w-8 text-primary-500 flex-shrink-0" />
    <div>
      <h3 className="font-semibold text-primary-900">Effective Date</h3>
      <p className="text-primary-700">{date}</p>
    </div>
  </div>
);

const PolicySection: React.FC<{ icon: React.ElementType; title: string; content: string }> = ({ icon: Icon, title, content }) => (
  <div className="flex flex-col sm:flex-row gap-6 md:gap-8 animate-slide-up" style={{ animationFillMode: 'backwards' }}>
    <div className="flex-shrink-0 flex sm:justify-center">
      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
        <Icon className="w-7 h-7 text-primary-600" />
      </div>
    </div>
    <div className="flex-grow">
      <h2 className="text-xl font-semibold text-gray-800 mt-0 mb-3">{title}</h2>
      <div className="prose prose-gray max-w-none 
                    prose-p:text-gray-600 
                    prose-strong:text-gray-800 
                    prose-ul:text-gray-600
                    prose-h3:text-gray-700
                    prose-li:marker:text-primary-500">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  </div>
);


// --- MAIN PAGE COMPONENT (Themed and Animated) ---

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-cream font-sans">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-medium p-8 md:p-12 animate-fade-in">
          <PageHeader />
          <EffectiveDateBox date="June 21, 2025" />
          
          <div className="space-y-12">
            {privacyContent.map((item, index) => (
              <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
                <PolicySection
                  icon={item.icon}
                  title={item.title}
                  content={item.content}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
