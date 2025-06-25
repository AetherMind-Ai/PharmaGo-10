import React, { useState, useRef } from 'react';
import { analyzeGoogleSheetAndUpload } from '../utils/googleSheetAnalyzer';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle,
  Loader,
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface GoogleSheetUploaderProps {
  onUploadComplete?: () => void;
}

const GoogleSheetUploader: React.FC<GoogleSheetUploaderProps> = ({ onUploadComplete }) => {
  const { user, userData } = useAuth();
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-1.5-flash' | 'gemini-2.0-flash' | 'gemini-2.5-flash'>('gemini-1.5-flash');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, elapsedTimeSeconds: 0 });
  const [result, setResult] = useState<{
    success: boolean;
    processedCount: number;
    totalCount: number;
    message: string;
    timeTakenSeconds?: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null); // Ref for AbortController

  const handleUpload = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }

    if (!userData?.pharmacyInfo?.name || !user?.uid) { // Ensure user.uid is available
      toast.error('Pharmacy information or user ID not found. Please log in.');
      return;
    }

    setIsUploading(true);
    setResult(null);
    setProgress({ current: 0, total: 0, elapsedTimeSeconds: 0 });
    abortControllerRef.current = new AbortController(); // Create new AbortController

    try {
      const uploadResult = await analyzeGoogleSheetAndUpload(
        sheetUrl,
        userData.pharmacyInfo.name,
        user.uid, // Pass the user's UID as pharmacyId
        selectedModel, // Pass the selected model
        (current: number, total: number, elapsedTimeSeconds: number) => {
          setProgress({ current, total, elapsedTimeSeconds });
        },
        abortControllerRef.current.signal // Pass the signal
      );

      setResult(uploadResult);

      if (uploadResult.success) {
        toast.success(uploadResult.message);
        setSheetUrl('');
        onUploadComplete?.();
      } else {
        toast.error(uploadResult.message);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Upload cancelled by user.');
        setResult({
          success: false,
          processedCount: progress.current, // Show how many were processed before cancel
          totalCount: progress.total,
          message: 'Upload cancelled by user.',
          timeTakenSeconds: progress.elapsedTimeSeconds
        });
      } else {
        toast.error(`Upload failed: ${error.message}`);
        setResult({
          success: false,
          processedCount: progress.current,
          totalCount: progress.total,
          message: error.message,
          timeTakenSeconds: progress.elapsedTimeSeconds
        });
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null; // Clear the controller
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort the ongoing operation
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center mb-4">
        <FileSpreadsheet className="w-6 h-6 text-green-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-800">Upload Products from Google Sheet</h3>
      </div>

      {/* Upload Limits Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Upload Limits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum 250 products per day</li>
              <li>• Maximum 4,000 products per month</li>
              <li>• Products are automatically processed with AI</li>
            </ul>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Google Sheet URL
        </label>
        <input
          type="url"
          id="sheetUrl"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isUploading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Make sure your sheet is publicly accessible or shared with view permissions
        </p>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-2">
          AI Model for Product Enrichment
        </label>
        <select
          id="aiModel"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as any)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isUploading}
        >
          <option value="gemini-1.5-flash">Gemini 1.5 (gemini-1.5-flash)</option>
          <option value="gemini-2.0-flash">Gemini 2.0 (gemini-2.0-flash)</option>
          <option value="gemini-2.5-flash">Gemini 2.5 (gemini-2.5-flash)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose the AI model to analyze and enrich your product data.
        </p>
      </div>

      {/* Progress */}
      {isUploading && progress.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Processing products...</span>
            <span>{progress.current}/{progress.total} ({formatTime(progress.elapsedTimeSeconds)})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Upload Successful!' : 'Upload Failed'}
              </p>
              <p className={`text-sm mt-1 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              {result.success && (
                <p className="text-sm text-green-700 mt-1">
                  Processed: {result.processedCount}/{result.totalCount} products
                </p>
              )}
              {result.timeTakenSeconds !== undefined && (
                <p className="text-sm text-gray-700 mt-1">
                  Time taken: {formatTime(result.timeTakenSeconds)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleUpload}
          disabled={isUploading || !sheetUrl.trim()}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <Loader className="animate-spin w-5 h-5 mr-2" />
              Processing...
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5 mr-2" />
              Analyze & Upload Products
            </>
          )}
        </button>
        <button
          onClick={handleCancelUpload}
          disabled={!isUploading}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          Stop Upload
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Sheet Format Requirements:</h4>
        <ul className="space-y-1 text-xs">
          <li>• Column headers: Product Name, Price, Original Price, Category, Brand, Amount/Quantity, Expiry Date</li>
          <li>• First row should contain column headers</li>
          <li>• Make sure the sheet is publicly accessible</li>
          <li>• Products will be automatically enriched with descriptions and images</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleSheetUploader;
