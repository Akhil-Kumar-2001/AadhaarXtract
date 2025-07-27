import React from 'react';

interface UploadSectionProps {
  frontImage: File | null;
  backImage: File | null;
  frontPreview: string | null;
  backPreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ frontImage, backImage, frontPreview, backPreview, handleFileChange }) => {
  return (
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Upload Aadhaar Images</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">Front Side</label>
          <div
            className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => document.getElementById('frontInput')?.click()}
          >
            <input
              id="frontInput"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handleFileChange(e, 'front')}
              className="hidden"
            />
            {frontPreview ? (
              <img src={frontPreview} alt="Front Preview" className="w-full h-48 object-contain rounded" />
            ) : (
              <>
                <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.178 1.987A3.5 3.5 0 0114.5 13H11v2H5.5V13zm3.5-7a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPEG (up to 10MB)</p>
              </>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-600 mb-2">Back Side</label>
          <div
            className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => document.getElementById('backInput')?.click()}
          >
            <input
              id="backInput"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handleFileChange(e, 'back')}
              className="hidden"
            />
            {backPreview ? (
              <img src={backPreview} alt="Back Preview" className="w-full h-48 object-contain rounded" />
            ) : (
              <>
                <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.178 1.987A3.5 3.5 0 0114.5 13H11v2H5.5V13zm3.5-7a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPEG (up to 10MB)</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;