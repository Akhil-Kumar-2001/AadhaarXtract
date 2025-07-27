
import type { IOcrResult } from "../Types/basictype";

interface DataSectionProps {
  ocrResult: IOcrResult | null;
  error: string | null;
  loading: boolean;
  handleSubmit: () => void;
}

 const DataSection: React.FC<DataSectionProps> = ({ ocrResult, error, loading, handleSubmit }) => {
  const result = ocrResult?.result;

  return (
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Extracted Data</h2>
      <p className="text-sm text-gray-600 mb-4">Upload both sides of the Aadhaar card to extract information</p>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 mb-6"
      >
        {loading ? 'Processing...' : 'Extract Data'}
      </button>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="space-y-3">
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Name:</strong> {result?.name || 'Not extracted'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Aadhaar Number:</strong> {result?.aadhaarNumber || 'Not extracted'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Gender:</strong> {result?.gender || 'Not extracted'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Date of Birth:</strong> {result?.dob || 'Not extracted'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Address:</strong> {result?.address || 'Not extracted'}</p>
        </div>
      </div>
    </div>
  );
};

export default DataSection