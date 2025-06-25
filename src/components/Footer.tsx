import React from 'react';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-3 mb-4">
<img
  src="https://i.ibb.co/N6br8w1K/IMG-2493.png"
  alt="PharmaGo Logo"
  className="w-14 h-14 rounded-xl shadow-lg"
/>
              <div>
                <h3 className="text-3xl font-extrabold text-white">PharmaGo</h3>
                
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Your trusted online pharmacy delivering authentic medicines and health products
              with professional medical consultation.
            </p>
            <div className="flex space-x-5">
              <a href="https://www.facebook.com/profile.php?id=61577594492902" className="text-gray-400 hover:text-blue-400 transition-colors duration-300" aria-label="Facebook">
                <Facebook size={22} />
              </a>
              <a href="https://www.instagram.com/pharma_go1/" className="text-gray-400 hover:text-blue-400 transition-colors duration-300" aria-label="Instagram">
                <Instagram size={22} />
              </a>
              <a href="https://www.youtube.com/@PharmaGo.1" className="text-gray-400 hover:text-blue-400 transition-colors duration-300" aria-label="YouTube">
                <Youtube size={22} />
              </a>
              <a href="https://www.tiktok.com/@pharma_go?lang=ar" className="text-gray-400 hover:text-blue-400 transition-colors duration-300" aria-label="TikTok">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-[22px] h-[22px]">
                  <path d="M12.843 2c.263 1.525 1.37 2.624 2.8 2.75v2.278c-.487.06-.947.014-1.36-.1v6.097c0 2.99-2.217 5.52-5.187 5.972-3.497.52-6.54-2.278-6.096-5.775.34-2.683 2.55-4.77 5.25-4.91v2.573c-1.143.087-2.123.918-2.267 2.093-.183 1.467.93 2.62 2.32 2.477 1.017-.1 1.943-.96 1.943-2.086V2h2.597z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="/products?category=Home" className="text-gray-400 hover:text-white transition-colors duration-300">Home</a></li>
              <li><a href="/products?category=Medications" className="text-gray-400 hover:text-white transition-colors duration-300">Medications</a></li>
              <li><a href="/products?category=Skin Care" className="text-gray-400 hover:text-white transition-colors duration-300">Skin Care</a></li>
              <li><a href="/products?category=Vitamins" className="text-gray-400 hover:text-white transition-colors duration-300">Vitamins</a></li>
              <li><a href="/products?category=Baby Care" className="text-gray-400 hover:text-white transition-colors duration-300">Baby Care</a></li>
              <li><a href="/products?category=Pet Care" className="text-gray-400 hover:text-white transition-colors duration-300">Pet Care</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">90-Min Express Delivery</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">AI Doctor Consultation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Prescription Upload</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Medicine Reminders</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Health Checkups</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Lab Tests</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-blue-400" />
                <span className="text-gray-400">+20 122 791 9119</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-blue-400" />
                <span className="text-gray-400">pharmago.help@gmail.com</span>
              </div>
            </div>

            <div className="mt-8">
              <h5 className="font-semibold mb-3 text-white">Download Our App</h5>
              <div className="flex space-x-3">
<button className="bg-blue-600 text-white w-32 flex items-center justify-center py-2.5 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors duration-300 shadow-md">
  <img src="https://i.ibb.co/Q7PBhJdM/app-store-icon-1760x2048-2rb6f013.png" alt="App Store Icon" className="w-6 h-6 mr-2 inline-block" />
  App Store
</button>
<button className="bg-green-600 text-white w-32 flex items-center justify-center py-2.5 rounded-lg text-base font-medium hover:bg-green-700 transition-colors duration-300 shadow-md">
  <img src="https://i.ibb.co/rG0kx8h5/google-play-store-icon-logo-symbol-free-png-removebg-preview.png" alt="Google Play Icon" className="w-6 h-6 mr-2 inline-block" />
  Google Play
</button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} PharmaGo. All rights reserved.
            </div> 
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <a href="/privacy-policy" className="text-gray-500 hover:text-white transition-colors duration-300">Privacy Policy</a>
              <a href="/terms-of-service" className="text-gray-500 hover:text-white transition-colors duration-300">Terms of Service</a>
              <a href="/center" className="text-gray-500 hover:text-white transition-colors duration-300">Help Center</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
