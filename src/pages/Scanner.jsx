import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Scanner = () => {
  const navigate = useNavigate();
  const [productData, setProductData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const scannerId = "reader";
    const html5QrCode = new Html5Qrcode(scannerId);
    const qrConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    const onScanSuccess = async (decodedText) => {
      console.log("Scanned value:", decodedText);
      html5QrCode.stop();

      try {
        const parts = decodedText.split(',');
        const productId = parts[0]; 
        const lineCode = parts[1];  
        const rawDate = parts[2];   
        
        const [day, month, year] = rawDate.split('/');
        const date = `${year}-${month}-${day}`;

        const url = `http://192.168.1.72:3000/data?productId=${productId}&date=${date}`;
        console.log("Requesting:", url);

        setIsLoading(true);
        setErrorMsg('');
        const res = await axios.get(url);
        setProductData({
          ...res.data,
          lineCode: lineCode || 'N/A',
        });

      } catch (err) {
        console.error("Fetch Error:", err);
        setErrorMsg(`Failed to fetch: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    Html5Qrcode.getCameras().then((devices) => {
      if (devices.length) {
        html5QrCode.start(devices[1].id, qrConfig, onScanSuccess);
      }
    }).catch((err) => {
      setErrorMsg("Camera access failed");
      console.error("Camera error:", err);
    });

    return () => {
      html5QrCode.stop().then(() => html5QrCode.clear()).catch(err => console.error(err));
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-6 px-4">
      <button
        onClick={() => navigate('/')}
        className="self-start text-sm text-yellow-400 hover:underline mb-4"
      >
        ← Back to Home
      </button>

      <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>

      <div id="reader" className="w-[300px] h-[300px] bg-white rounded-lg shadow-lg" />

      {isLoading && <p className="mt-4 text-yellow-400">🔄 Fetching data...</p>}
      {errorMsg && <p className="mt-4 text-red-500">{errorMsg}</p>}

      {productData && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg w-full max-w-md">
          <h3 className="text-xl font-semibold text-yellow-400 mb-2">Product Details</h3>
          <p><strong>ID:</strong> {productData.id || 'N/A'}</p>
          <p><strong>Name:</strong> {productData.name || 'N/A'}</p>
          <p><strong>Line Code:</strong> {productData.lineCode || 'N/A'}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                productData.status === 'Verified'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {productData.status}
            </span>
          </p>
          <p><strong>Date:</strong> {productData.date || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;
