// import React, { useState } from 'react';
// import type { OcrResult } from '../Types/basictype';

// const OcrUpload: React.FC = () => {
//   const [frontImage, setFrontImage] = useState<File | null>(null);
//   const [backImage, setBackImage] = useState<File | null>(null);
//   const [frontPreview, setFrontPreview] = useState<string | null>(null);
//   const [backPreview, setBackPreview] = useState<string | null>(null);
//   const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
//     const file = e.target.files?.[0];
//     if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
//       if (type === 'front') {
//         setFrontImage(file);
//         setFrontPreview(URL.createObjectURL(file));
//       } else {
//         setBackImage(file);
//         setBackPreview(URL.createObjectURL(file));
//       }
//       setError(null);
//     } else {
//       setError('Please upload a valid JPEG or PNG image');
//     }
//   };

//   const handleSubmit = async () => {
//     if (!frontImage || !backImage) {
//       setError('Please upload both front and back images');
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append('frontImage', frontImage);
//     formData.append('backImage', backImage);

//     try {
//       const response = await fetch('http://localhost:5000/api/ocr/process', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('Failed to process images');
//       }

//       const result: OcrResult = await response.json();
//       setOcrResult(result);
//     } catch (err) {
//       setError('Error processing images. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex items-center justify-center p-4">
//       <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 border border-blue-200">
//         <h1 className="text-3xl font-bold text-blue-800 text-center mb-8">Aadhaar OCR Processor</h1>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Upload Section */}
//           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-shadow duration-300">
//             <h2 className="text-xl font-semibold text-blue-700 mb-4">Upload Aadhaar Images</h2>
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-blue-600 mb-2">Front Side</label>
//                 <div
//                   className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
//                   onClick={() => document.getElementById('frontInput')?.click()}
//                 >
//                   <input
//                     id="frontInput"
//                     type="file"
//                     accept="image/jpeg,image/png"
//                     onChange={(e) => handleFileChange(e, 'front')}
//                     className="hidden"
//                   />
//                   {frontPreview ? (
//                     <img src={frontPreview} alt="Front Preview" className="w-full h-48 object-contain rounded" />
//                   ) : (
//                     <>
//                       <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
//                         <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.178 1.987A3.5 3.5 0 0114.5 13H11v2H5.5V13zm3.5-7a2 2 0 100 4 2 2 0 000-4z" />
//                       </svg>
//                       <p className="text-gray-600">Click to upload or drag and drop</p>
//                       <p className="text-xs text-gray-500">PNG, JPEG (up to 10MB)</p>
//                     </>
//                   )}
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-blue-600 mb-2">Back Side</label>
//                 <div
//                   className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
//                   onClick={() => document.getElementById('backInput')?.click()}
//                 >
//                   <input
//                     id="backInput"
//                     type="file"
//                     accept="image/jpeg,image/png"
//                     onChange={(e) => handleFileChange(e, 'back')}
//                     className="hidden"
//                   />
//                   {backPreview ? (
//                     <img src={backPreview} alt="Back Preview" className="w-full h-48 object-contain rounded" />
//                   ) : (
//                     <>
//                       <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
//                         <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.178 1.987A3.5 3.5 0 0114.5 13H11v2H5.5V13zm3.5-7a2 2 0 100 4 2 2 0 000-4z" />
//                       </svg>
//                       <p className="text-gray-600">Click to upload or drag and drop</p>
//                       <p className="text-xs text-gray-500">PNG, JPEG (up to 10MB)</p>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Extracted Data Section */}
//           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-shadow duration-300">
//             <h2 className="text-xl font-semibold text-blue-700 mb-4">Extracted Data</h2>
//             <p className="text-sm text-gray-600 mb-4">Upload both sides of the Aadhaar card to extract information</p>
//             <button
//               onClick={handleSubmit}
//               disabled={loading || !frontImage || !backImage}
//               className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 mb-6"
//             >
//               {loading ? 'Processing...' : 'Extract Data'}
//             </button>
//             {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
//             <div className="space-y-3">
//               <div className="bg-white p-3 rounded-lg border border-blue-200">
//                 <p className="text-sm text-blue-800"><strong>Name:</strong> {ocrResult?.name || 'Not extracted'}</p>
//               </div>
//               <div className="bg-white p-3 rounded-lg border border-blue-200">
//                 <p className="text-sm text-blue-800"><strong>Aadhaar Number:</strong> {ocrResult?.aadhaarNumber || 'Not extracted'}</p>
//               </div>
//               <div className="bg-white p-3 rounded-lg border border-blue-200">
//                 <p className="text-sm text-blue-800"><strong>Gender:</strong> {ocrResult?.gender || 'Not extracted'}</p>
//               </div>
//               <div className="bg-white p-3 rounded-lg border border-blue-200">
//                 <p className="text-sm text-blue-800"><strong>Date of Birth:</strong> {ocrResult?.dob || 'Not extracted'}</p>
//               </div>
//               <div className="bg-white p-3 rounded-lg border border-blue-200">
//                 <p className="text-sm text-blue-800"><strong>Address:</strong> {ocrResult?.address || 'Not extracted'}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OcrUpload;

















import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import UploadSection from './UploadSection';
import DataSection from './DataSection';
import type { IOcrResult } from '../Types/basictype';
import { processOcrImages } from '../service/ocrService';


const OcrUpload: React.FC = () => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<IOcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      if (type === 'front') {
        setFrontImage(file);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        setBackImage(file);
        setBackPreview(URL.createObjectURL(file));
      }
      setError(null);
    } else {
      setError('Please upload a valid JPEG or PNG image');
    }
  };

const handleSubmit = async () => {
  if (!frontImage || !backImage) {
    setError('Please upload both front and back images');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await processOcrImages(frontImage, backImage);
    setOcrResult(result);
  } catch (err) {
    setError('Error processing images. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <Header />
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UploadSection
            frontImage={frontImage}
            backImage={backImage}
            frontPreview={frontPreview}
            backPreview={backPreview}
            handleFileChange={handleFileChange}
          />
          <DataSection
            ocrResult={ocrResult}
            error={error}
            loading={loading}
            handleSubmit={handleSubmit}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OcrUpload;