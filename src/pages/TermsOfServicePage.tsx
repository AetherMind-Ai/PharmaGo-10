import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Plugin for GitHub Flavored Markdown

// --- ICON IMPORTS from lucide-react ---
// TriangleAlert has been replaced with Ban.
import {
  FileCheck2,
  ScrollText,
  ShieldAlert,
  Ban, // <-- REPLACED ICON
  Gem,
  Link,
  RefreshCw,
  Scale,
  CalendarDays,
} from 'lucide-react';

// --- DATA: Content stored as Markdown for easy updates ---
const termsContent = [
  {
    icon: FileCheck2,
    title: "1. Acceptance of Terms",
    content: `By accessing or using the **PharmaGo** mobile application and website (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). You are responsible for compliance with all applicable local laws. If you do not agree, you are prohibited from using this Service.`,
  },
  {
    icon: ScrollText,
    title: "2. Use License",
    content: `Permission is granted for personal, non-commercial use only. This is a license, not a transfer of title. Under this license you **may not**:
    
*   Modify or copy the materials.
*   Use materials for any commercial purpose or public display.
*   Attempt to decompile or reverse engineer any software.
*   Remove copyright notations.
*   Transfer or "mirror" the materials on another server.
    
This license terminates automatically if you violate these restrictions.`
  },
  {
    icon: ShieldAlert,
    title: "3. Disclaimer",
    content: `The materials on PharmaGo's Service are provided on an **'as is'** basis. PharmaGo makes no warranties, expressed or implied, and disclaims all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.`,
  },
  {
    icon: Ban, // <-- ICON UPDATED HERE
    title: "4. Limitations",
    content: `In no event shall PharmaGo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PharmaGo's Service.`
  },
  {
    icon: Ban, // Reusing the Ban icon for consistency with cancellation theme
    title: "5. Order Cancellation Policy",
    content: `Once an order has been confirmed and processed through the PharmaGo Service, it **cannot be cancelled** by the user. All sales are considered final upon confirmation. For any urgent issues or inquiries regarding a confirmed order, please contact our customer support team immediately.`,
  },
  {
    icon: Gem,
    title: "6. Accuracy of Materials",
    content: `The materials on our Service may include technical, typographical, or photographic errors. PharmaGo does not warrant that any materials are accurate, complete, or current, and may make changes at any time without notice.`,
  },
  {
    icon: Link,
    title: "7. Links",
    content: `PharmaGo has not reviewed all of the sites linked to its Service and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by PharmaGo. Use of any linked website is at the user's own risk.`,
  },
  {
    icon: RefreshCw,
    title: "8. Modifications",
    content: `PharmaGo may revise these Terms of Service at any time without notice. By using this Service, you are agreeing to be bound by the then-current version of these Terms.`,
  },
  {
    icon: Scale,
    title: "9. Governing Law",
    content: `These terms are governed by and construed in accordance with the laws of **[Your Country/State]**, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.`,
  },
];


// --- SUB-COMPONENTS (Styled with your custom theme) ---

const PageHeader: React.FC = () => (
  <div className="text-center mb-16">
    <div className="inline-block p-4 mb-6 bg-primary-100 rounded-full animate-float">
      <ScrollText className="h-12 w-12 text-primary-600" />
    </div>
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
      Terms of Service
    </h1>
    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
      Welcome to PharmaGo! Here are the rules of the road for using our services. Please read them carefully.
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

const TermSection: React.FC<{ icon: React.ElementType; title: string; content: string }> = ({ icon: Icon, title, content }) => (
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
                    prose-li:marker:text-primary-500">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  </div>
);


// --- MAIN PAGE COMPONENT (Themed and Animated) ---

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="bg-cream font-sans">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-medium p-8 md:p-12 animate-fade-in">
          <PageHeader />
          <EffectiveDateBox date="June 21, 2025" />
          
          <div className="space-y-12">
            {termsContent.map((term, index) => (
              <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
                <TermSection
                  icon={term.icon}
                  title={term.title}
                  content={term.content}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
