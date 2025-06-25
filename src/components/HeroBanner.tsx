import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Truck, Shield, Clock, Sparkles, Heart, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HeroBanner: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Healthcare Made Simple',
      subtitle: 'Get medicines and health products delivered to your doorstep',
      image: 'https://media.istockphoto.com/id/1438139879/photo/young-man-takes-medication-prescribed-by-his-physician-man-taking-a-pill-and-drinking-a-glass.jpg?s=612x612&w=0&k=20&c=VvEWEqVf6Vek6AsrESRoZD2VC8DR7yrAA15NUptK3Qw=',
      cta: 'Shop Now',
      bg: 'from-light-blue to-medium-blue',
      icon: <Heart className="w-8 h-8" />
    },
    {
      title: 'Express Delivery',
      subtitle: 'Medicines delivered in 90 minutes to your location',
      image: 'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg',
      cta: 'Order Now',
      bg: 'from-medium-blue to-dark-blue',
      icon: <Truck className="w-8 h-8" />
    },
    {
      title: 'AI Doctor Consultation',
      subtitle: 'Get instant health advice from our AI medical assistant',
      image: 'https://www.thebrighterside.news/uploads/2025/01/AI-doctor-2-e1739480755336.webp?format=auto&optimize=high&width=1440i',
      cta: 'Chat Now',
      bg: 'from-dark-blue to-primary-800',
      icon: <Sparkles className="w-8 h-8" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative overflow-hidden bg-cream">
      {/* Main Banner */}
      <div className="relative h-[600px] md:h-[700px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transform transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'translate-x-0 opacity-100' : 
              index < currentSlide ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
            }`}
          >
            <div className={`bg-gradient-to-br ${slide.bg} h-full flex items-center relative overflow-hidden`}>
              {/* Decorative elements */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/20 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/15 rounded-full blur-lg animate-float" style={{animationDelay: '2s'}}></div>
              </div>
              
              <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="text-white space-y-8 animate-slide-up">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        {slide.icon}
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/50 to-transparent"></div>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                      {slide.title}
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button className="bg-white text-dark-blue px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        {slide.cta}
                      </button>
                      
                      <button className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-dark-blue transition-all duration-300">
                        Learn More
                      </button>
                    </div>
                  </div>
                  
                  <div className="hidden md:block relative">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="relative rounded-3xl shadow-2xl max-w-lg mx-auto border-4 border-white/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all duration-300 group`}
        >
          {isRTL ? <ChevronRight size={24} className="text-white group-hover:scale-110 transition-transform" /> : <ChevronLeft size={24} className="text-white group-hover:scale-110 transition-transform" />}
        </button>
        
        <button
          onClick={nextSlide}
          className={`absolute ${isRTL ? 'left-6' : 'right-6'} top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all duration-300 group`}
        >
          {isRTL ? <ChevronLeft size={24} className="text-white group-hover:scale-110 transition-transform" /> : <ChevronRight size={24} className="text-white group-hover:scale-110 transition-transform" />}
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4 group cursor-pointer">
              <div className="bg-gradient-to-r from-light-blue to-medium-blue p-4 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                <Truck className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800 mb-1">Express Delivery</h3>
                <p className="text-gray-600">90-minute delivery to your doorstep</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 group cursor-pointer">
              <div className="bg-gradient-to-r from-medium-blue to-dark-blue p-4 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                <Shield className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800 mb-1">100% Authentic</h3>
                <p className="text-gray-600">Verified genuine medicines only</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 group cursor-pointer">
              <div className="bg-gradient-to-r from-dark-blue to-primary-800 p-4 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                <Clock className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800 mb-1">24/7 Support</h3>
                <p className="text-gray-600">AI doctor consultation available anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;