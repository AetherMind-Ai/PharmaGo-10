import React from 'react';
import { ArrowRight, Star, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Brand } from '../types';

interface FeaturedBrandsProps {
  className?: string;
}

const FeaturedBrands: React.FC<FeaturedBrandsProps> = ({ className }) => {
  const { t, isRTL } = useLanguage();

  const brands: Brand[] = [
    {
      id: 'panadol',
      name: 'Panadol',
      logo: 'https://i-cf65.ch-static.com/content/dam/cf-consumer-healthcare/health-professionals/en_PK/pain-relief/panadol/Panadol_logo_750x421.jpg?auto=format',
      description: 'Trusted pain relief solutions for everyday health',
      productCount: 25,
      website: 'https://www.panadol.com/',
      nationality: 'British'
    },
    {
      id: 'glaxosmithkline',
      name: 'GlaxoSmithKline',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/GSK_logo_2014.svg/1189px-GSK_logo_2014.svg.png',
      description: 'Leading pharmaceutical and healthcare innovations',
      productCount: 150,
      website: 'https://www.gsk.com/',
      nationality: 'British'
    },
    {
      id: 'abbott',
      name: 'Abbott',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSACAbCOmT8E1kBdkK3PD6d-AboJffWBgwWEA&s',
      description: 'Nutrition and healthcare products for better living',
      productCount: 89,
      website: 'https://www.abbott.com/',
      nationality: 'American'
    },
    {
      id: 'novartis',
      name: 'Novartis',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtX4c4GRTnh5EQucDWwJN4UWefI48YdnT-ZQ&s',
      description: 'Innovative medicines and breakthrough treatments',
      productCount: 112,
      website: 'https://www.novartis.com/',
      nationality: 'Swiss'
    },
    {
      id: 'bayer',
      name: 'Bayer',
      logo: 'https://logos-world.net/wp-content/uploads/2022/11/Bayer-Emblem.png',
      description: 'Consumer health and pharmaceutical excellence',
      productCount: 67,
      website: 'https://www.bayer.com/',
      nationality: 'German'
    },
    {
      id: 'pfizer',
      name: 'Pfizer',
      logo: 'https://media.edgeprop.my/s3fs-public/editorial/my/2020/December/22/Pfizer.png',
      description: 'Global leader in pharmaceutical innovation',
      productCount: 134,
      website: 'https://www.pfizer.com/',
      nationality: 'American'
    },
    {
      id: 'sanofi',
      name: 'Sanofi',
      logo: 'https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/042021/logo-sanofi-01.jpg?74lBzBN1W3Fkb5SSmK1VOS2IZxdg7IXV&itok=PPKRHx1k',
      description: 'Dedicated to supporting healthcare needs worldwide',
      productCount: 98,
      website: 'https://www.sanofi.com/',
      nationality: 'French'
    },
    {
      id: 'roche',
      name: 'Roche',
      logo: 'https://www.designyourway.net/blog/wp-content/uploads/2024/04/roche-logo.jpg',
      description: 'Pioneering healthcare through science and innovation',
      productCount: 76,
      website: 'https://www.roche.com/',
      nationality: 'Swiss'
    }
  ];

  return (
    <section className={`py-20 bg-cream ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-dark-blue"></div>
            <div className="p-3 bg-gradient-to-r from-medium-blue to-dark-blue rounded-full">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-dark-blue"></div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            {t('topBrands')}
          </h2>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
            Partner with the most trusted pharmaceutical companies for quality healthcare
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              className="group cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card card-hover h-full">
                <div className="p-6">
                  <div className="relative mb-6">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl text-gray-800 mb-3 group-hover:text-dark-blue transition-colors">
                    {brand.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {brand.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-dark-blue font-semibold text-sm">
                        {brand.nationality}
                      </span>
                    </div>
                    
                    <a 
                      href={brand.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-2 text-dark-blue hover:text-medium-blue transition-colors group-hover:translate-x-1 transform duration-300"
                    >
                      <span className="text-sm font-medium">{t('Visit Website')}</span>
                      {isRTL ? 
                        <ArrowRight size={16} className="rotate-180" /> : 
                        <ArrowRight size={16} />
                      }
                    </a>
                  </div>
                  
                  {/* Rating stars */}
                  <div className="flex items-center space-x-1 mt-4 pt-4 border-t border-gray-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className="text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">Verified Partner</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrands;
