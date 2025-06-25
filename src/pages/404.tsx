import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFoundPage: React.FC = () => {
  // Define the color palette for easy reference
  const colors = {
    background: '#F6F4EB',
    lightBlue: '#91C8E4',
    mediumBlue: '#749BC2',
    darkBlue: '#4682A9',
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full px-4 text-center"
      style={{ backgroundColor: colors.background, color: colors.darkBlue }}
    >
      <div className="max-w-md w-full">
        {/* Subtle decorative shapes */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full opacity-50"
            style={{ backgroundColor: colors.lightBlue }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-75"
            style={{ backgroundColor: colors.mediumBlue }}
          ></div>
          
          {/* The "404" text, layered on top */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-9xl font-extrabold tracking-tighter" style={{ color: colors.darkBlue }}>
              404
            </h1>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mt-6" style={{ color: colors.darkBlue }}>
          Page Not Found
        </h2>

        <p className="text-lg mt-4" style={{ color: colors.mediumBlue }}>
          Oops! The page you are looking for seems to have taken a little detour.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 mt-10 font-semibold text-white rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          style={{ backgroundColor: colors.darkBlue }}
        >
          <FiHome />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;