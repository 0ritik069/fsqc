import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/qr-app.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center space-y-6">
        <img src={logo} alt="FSQC Logo" className="w-48 h-48 rounded-xl shadow-xl" />
        <h1 className="text-4xl font-extrabold text-yellow-600">FSQC Web App</h1>
        <p className="text-center text-sm text-gray-300 max-w-sm">
          A fast and secure web app for verifying information from QR codes on Android & iOS browsers.
        </p>
        <button
          onClick={() => navigate('/scanner')}
          className="bg-red-800 hover:bg-red-700 transition px-8 py-3 rounded-full font-semibold text-white shadow-md"
        >
          Start Scanning
        </button>
      </div>
    </div>
  );
};

export default Home;
