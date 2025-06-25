import { Product, Brand, Category } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Panadol Extra Strength',
    description: 'Fast-acting pain relief tablets for headaches, muscle pain, and fever reduction',
    price: 12.99,
    originalPrice: 16.99,
    image: 'https://i-cf65.ch-static.com/content/dam/cf-consumer-healthcare/panadol-reborn/en_CB/products-beacon/carousal-images/panadol-extra-strength.png?auto=format',
    images: [], // Added images array
    category: 'Medications',
    brand: 'Panadol',
    inStock: true,
    rating: 4.5,
    reviewCount: 1250,
    deliveryTime: '90min',
    tags: ['pain relief', 'fever', 'headache'],
    prescriptionRequired: false
  },
  {
    id: '2',
    name: 'Nivea Daily Essentials Moisturizer',
    description: 'Hydrating face cream for daily use with SPF 15 protection',
    price: 8.99,
    image: 'https://healthwisepharmacies.ie/wp-content/uploads/2021/09/4005808120208.jpg',
    images: [], // Added images array
    category: 'Skin Care',
    brand: 'Nivea',
    inStock: true,
    rating: 4.2,
    reviewCount: 890,
    deliveryTime: 'scheduled',
    tags: ['moisturizer', 'SPF', 'daily care']
  },
  {
    id: '3',
    name: 'Abbott Ensure Nutrition Shake',
    description: 'Complete nutrition drink with 26 essential vitamins and minerals',
    price: 24.99,
    image: 'https://m.media-amazon.com/images/I/81advJFWSoL._AC_UF1000,1000_QL80_.jpg',
    images: [], // Added images array
    category: 'Vitamins',
    brand: 'Abbott',
    inStock: false,
    rating: 4.7,
    reviewCount: 650,
    deliveryTime: 'scheduled',
    tags: ['nutrition', 'vitamins', 'health drink']
  },
  {
    id: '4',
    name: 'Johnson\'s Baby Shampoo',
    description: 'No more tears formula, gentle cleansing for baby\'s delicate hair and scalp',
    price: 6.99,
    originalPrice: 8.99,
    image: 'https://m.media-amazon.com/images/I/61ohaSPJCWL._AC_SX679_.jpg',
    images: [], // Added images array
    category: 'Baby Care',
    brand: 'Johnson & Johnson',
    inStock: true,
    rating: 4.8,
    reviewCount: 2100,
    deliveryTime: '90min',
    tags: ['baby care', 'shampoo', 'gentle']
  },
  {
    id: '5',
    name: 'Bayer Aspirin 325mg',
    description: 'Pain reliever and fever reducer, also used for heart health',
    price: 9.99,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ95T1uwhEKgDIYFUDecTSRumaPwPZl-Qh3A&s',
    images: [], // Added images array
    category: 'Medications',
    brand: 'Bayer',
    inStock: true,
    rating: 4.3,
    reviewCount: 780,
    deliveryTime: '90min',
    tags: ['pain relief', 'heart health', 'aspirin'],
    prescriptionRequired: false
  },
  {
    id: '6',
    name: 'Pfizer Centrum Multivitamin',
    description: 'Complete multivitamin with 24 key nutrients for daily health support',
    price: 19.99,
    image: 'https://cdn.salla.sa/wWAxXe/aiJFi6oyWcXa77fneSMnfQ4jscRUROWPCefSwXHF.jpg',
    images: [], // Added images array
    category: 'Vitamins',
    brand: 'Pfizer',
    inStock: true,
    rating: 4.4,
    reviewCount: 1100,
    deliveryTime: 'scheduled',
    tags: ['multivitamin', 'daily health', 'nutrients']
  },
  {
    id: '7',
    name: 'Royal Canin Dog Food',
    description: 'Premium nutrition for adult dogs with balanced protein and nutrients',
    price: 45.99,
    originalPrice: 52.99,
    image: 'https://www.animed.co.uk/media/catalog/product/3/1/3182550793001_10_znp2mja97fq1s00o.jpg?optimize=medium&bg-color=255,255,255&fit=bounds&height=&width=',
    images: [], // Added images array
    category: 'Pet Care',
    brand: 'Royal Canin',
    inStock: true,
    rating: 4.6,
    reviewCount: 320,
    deliveryTime: 'scheduled',
    tags: ['dog food', 'premium nutrition', 'adult dogs']
  },
  {
    id: '8',
    name: 'Omron Blood Pressure Monitor',
    description: 'Digital automatic blood pressure monitor with large display',
    price: 89.99,
    image: 'https://m.media-amazon.com/images/I/61waWWTTCPL.jpg',
    images: [], // Added images array
    category: 'Medical Devices',
    brand: 'Omron',
    inStock: true,
    rating: 4.5,
    reviewCount: 450,
    deliveryTime: 'scheduled',
    tags: ['blood pressure', 'monitor', 'digital']
  },
  {
    id: '9',
    name: 'Band-Aid Brand Adhesive Bandages',
    description: 'Flexible fabric bandages for minor cuts and scrapes',
    price: 4.99,
    image: 'https://m.media-amazon.com/images/I/81gv+J2XzHL._UF1000,1000_QL80_.jpg',
    images: [], // Added images array
    category: 'First Aid',
    brand: 'Band-Aid',
    inStock: true,
    rating: 4.7,
    reviewCount: 900,
    deliveryTime: '90min',
    tags: ['first aid', 'bandages', 'wound care']
  },
  {
    id: '10',
    name: 'Sensodyne Toothpaste',
    description: 'Sensitivity relief toothpaste for strong teeth and healthy gums',
    price: 7.49,
    originalPrice: 9.99,
    image: 'https://i5.walmartimages.com/seo/Sensodyne-Sensitivity-Gum-Whitening-Sensitive-Toothpaste-3-4-Oz_14f52add-8841-4453-b891-83daa9e0a1f9.5a384bd65fda56e1b95e75b7f6886f06.jpeg',
    images: [], // Added images array
    category: 'Oral Care',
    brand: 'Sensodyne',
    inStock: true,
    rating: 4.3,
    reviewCount: 600,
    deliveryTime: 'scheduled',
    tags: ['toothpaste', 'sensitivity', 'oral hygiene']
  },
  {
    id: '11',
    name: 'Vicks VapoRub',
    description: 'Topical cough suppressant and analgesic for cold and flu symptoms',
    price: 5.99,
    image: 'https://pics.walgreens.com/prodimg/166199/450.jpg',
    images: [], // Added images array
    category: 'Cold & Flu',
    brand: 'Vicks',
    inStock: true,
    rating: 4.6,
    reviewCount: 1500,
    deliveryTime: '90min',
    tags: ['cold relief', 'cough', 'flu']
  },
  {
    id: '12',
    name: 'Cetaphil Gentle Skin Cleanser',
    description: 'Mild, non-irritating formula for all skin types, including sensitive skin',
    price: 14.99,
    image: 'https://i.ebayimg.com/images/g/ayEAAOSwxktdVNaj/s-l1200.jpg',
    images: [], // Added images array
    category: 'Skin Care',
    brand: 'Cetaphil',
    inStock: true,
    rating: 4.8,
    reviewCount: 1800,
    deliveryTime: 'scheduled',
    tags: ['cleanser', 'sensitive skin', 'dermatologist recommended']
  },
  {
    id: '13',
    name: 'Pediasure Grow & Gain',
    description: 'Nutritional shake for kids to help fill nutritional gaps',
    price: 28.99,
    image: 'https://www.pediasure.com/nutrition-drinks-for-kids/grow-gain-nutrition-powder/_jcr_content/root/container_copy_copy_/columncontrol_copy/tab_item_no_1/image.coreimg.85.1024.jpeg/1718088843638/pds-22-0802901-img-pediasure-grow-and-gain-powder-vanilla.jpeg',
    images: [], // Added images array
    category: 'Baby Care',
    brand: 'Pediasure',
    inStock: true,
    rating: 4.7,
    reviewCount: 700,
    deliveryTime: 'scheduled',
    tags: ['kids nutrition', 'growth', 'shake']
  },
  {
    id: '14',
    name: 'Tylenol Extra Strength',
    description: 'Acetaminophen for fast, effective relief of pain and fever',
    price: 11.99,
    originalPrice: 14.99,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwnvErZIBk4IFE-nYCUQLBwb0ospUUwUPP7Q&s',
    images: [], // Added images array
    category: 'Medications',
    brand: 'Tylenol',
    inStock: true,
    rating: 4.4,
    reviewCount: 1000,
    deliveryTime: '90min',
    tags: ['pain relief', 'fever', 'acetaminophen'],
    prescriptionRequired: false
  },
  {
    id: '15',
    name: 'Neutrogena Hydro Boost Water Gel',
    description: 'Hydrating gel moisturizer with hyaluronic acid for dry skin',
    price: 17.99,
    image: 'https://m.media-amazon.com/images/I/71Wec9b3eXL._SL1500_.jpg',
    images: [], // Added images array
    category: 'Skin Care',
    brand: 'Neutrogena',
    inStock: true,
    rating: 4.6,
    reviewCount: 1120,
    deliveryTime: 'scheduled',
    tags: ['moisturizer', 'hyaluronic acid', 'dry skin']
  }
];
