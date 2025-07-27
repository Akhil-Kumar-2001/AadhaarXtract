import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-b-2xl shadow-lg">
      <h1 className="text-4xl font-bold text-center">AadhaarXtract</h1>
      <p className="text-center text-sm mt-1">Extract Information from Aadhaar Cards Effortlessly</p>
    </header>
  );
};

export default Header;