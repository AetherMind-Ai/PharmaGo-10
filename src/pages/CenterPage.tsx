import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';
import { FaSpinner, FaPaperPlane } from 'react-icons/fa';

const FORMSPREE_FORM_ID = import.meta.env.VITE_FORMSPREE_FORM_ID;

const CenterPage: React.FC = () => {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    userName: '',
    fullName: '',
    phoneNumber: '',
    role: '',
    message: '',
    cityName: '',
    pharmacyName: '',
    deliveryCompanyName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        email: userData.email || '',
        userName: userData.username || '',
        fullName: userData.fullName || '',
        phoneNumber: userData.phoneNumber || '',
        role: userData.role || '',
      }));
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Your message has been sent successfully!');
        setFormData({
          email: userData?.email || '',
          userName: userData?.username || '',
          fullName: userData?.fullName || '',
          phoneNumber: userData?.phoneNumber || '',
          role: userData?.role || '',
          message: '',
          cityName: '',
          pharmacyName: '',
          deliveryCompanyName: '',
        });
      } else {
        const errorData = await response.json();
        console.error('Formspree submission error:', errorData);
        toast.error('Failed to send your message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Help Center & Contact Us
          </span>
        </h1>
        <p className="text-center text-gray-600 mb-10 text-lg">
          Have a question or need assistance? Fill out the form below and we'll get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
                required
              />
            </div>
            <div>
              <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-1">User Name</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1">Your Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 bg-white appearance-none pr-8 transition duration-200 ease-in-out"
              required
            >
              <option value="">Select your role</option>
              <option value="client">Client</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {formData.role === 'pharmacy' && (
            <div>
              <label htmlFor="pharmacyName" className="block text-sm font-semibold text-gray-700 mb-1">Pharmacy Name</label>
              <input
                type="text"
                id="pharmacyName"
                name="pharmacyName"
                value={formData.pharmacyName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
                required
              />
            </div>
          )}
          {formData.role === 'delivery' && (
            <div>
              <label htmlFor="deliveryCompanyName" className="block text-sm font-semibold text-gray-700 mb-1">Delivery Company Name</label>
              <input
                type="text"
                id="deliveryCompanyName"
                name="deliveryCompanyName"
                value={formData.deliveryCompanyName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="cityName" className="block text-sm font-semibold text-gray-700 mb-1">City Name</label>
            <input
              type="text"
              id="cityName"
              name="cityName"
              value={formData.cityName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">Your Message</label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-400 transition duration-200 ease-in-out"
              placeholder="Type your message here..."
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin mr-3 text-xl" />
            ) : (
              <FaPaperPlane className="mr-3 text-xl" />
            )}
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default CenterPage;
