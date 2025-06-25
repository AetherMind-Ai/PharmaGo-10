import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

interface ImageModalProps {
    images: string[];
    isOpen: boolean;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ images, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${index + 1}.png`; // You might want to derive a better name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">All Photos</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
                        <FaTimes className="text-2xl" />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 grid-cols-4 gap-4 overflow-y-auto flex-grow" style={{ maxHeight: '450px' }}>
                    {images.map((imgSrc, index) => (
                        <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden shadow-md group">
                            <img
                                src={imgSrc}
                                alt={`Gallery Image ${index + 1}`}
                                className="w-full h-50 object-cover" // Fixed size for consistency
                                style={{ width: '200px', height: '200px' }}
                            />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={() => handleDownload(imgSrc, index)}
                                    className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition"
                                    title="Download Image"
                                >
                                    <FaDownload />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ImageModal;
