import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import logo from '../assets/qr-app.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [productData, setProductData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showScanner) return;

    const scannerId = 'reader';
    const html5QrCode = new Html5Qrcode(scannerId);
    setHtml5QrCodeInstance(html5QrCode);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = async (decodedText) => {
      if (hasScanned) return;
      setHasScanned(true);

      console.log('Scanned:', decodedText);

      try {
        setIsLoading(true);
        setErrorMsg('');
        setProductData(null);

        const parts = decodedText.split(',');
        if (parts.length !== 3) throw new Error('Invalid QR Code Format');

        const [productId, lineCode, rawDate] = parts;
        const [day, month, year] = rawDate.split('/');
        if (!day || !month || !year) throw new Error('Invalid Date Format');

        const date = `${year}-${month}-${day}`;
        const url = `https://sisccltd.com/QRWebApp/data?productId=${productId}&date=${date}`;

        const res = await axios.get(url);
        // Navigate to table view with data
        navigate('/table', { state: { data: res.data } });

        await html5QrCode.stop();
        setShowScanner(false);
      } catch (err) {
        console.error('Scan error:', err);
        setErrorMsg(`Error:${err.message || 'Failed to fetch data'}`);
        if (err.response) {

          console.log('Response:', err.response);
        } else if (err.request) {

          console.log('No response from server:', err.request);
        } else {

          console.log('Error setting up request:', err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices.length) {
          setErrorMsg('No camera found');
          return;
        }

        const backCam = devices.find((d) => /back|rear/i.test(d.label));
        const cameraId = backCam ? backCam.id : devices[0].id;

        html5QrCode
          .start(cameraId, config, onScanSuccess)
          .catch((err) => {
            console.error('Start error:', err);
            setErrorMsg('Failed to start camera');
          });
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setErrorMsg('Camera access error');
      });

    return () => {
      html5QrCode
        .stop()
        .then(() => html5QrCode.clear())
        .catch((err) => console.error('Cleanup error:', err));
    };
  }, [showScanner, hasScanned]);

  const closeScanner = async () => {
    if (html5QrCodeInstance) {
      await html5QrCodeInstance.stop();
      await html5QrCodeInstance.clear();
    }
    setShowScanner(false);
    setErrorMsg('');
  };

  return (
    <div className="relative">
      <div
        className={`min-h-screen bg-gradient-to-br from-black to-gray-800 text-white flex flex-col items-center justify-center px-4 transition duration-300 ${showScanner ? 'blur-sm pointer-events-none' : ''
          }`}
      >
        <img src={logo} alt="FSQC Logo" className="w-48 h-48 rounded-xl shadow-xl mb-4" />
        <h1 className="text-4xl font-extrabold text-yellow-600">FSQC Web App</h1>
        <p className="text-center text-sm text-gray-300 max-w-sm my-4">
          A fast and secure web app for verifying information from QR codes on Android & iOS browsers.
        </p>
        <button
          onClick={() => {
            setProductData(null);
            setErrorMsg('');
            setHasScanned(false);
            setShowScanner(true);
          }}
          className="bg-red-800 hover:bg-red-700 transition px-8 py-3 rounded-full font-semibold text-white shadow-md"
        >
          Start Scanning
        </button>
      </div>


      {showScanner && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 px-4">
          <div className="w-[300px] h-[300px] bg-white rounded-lg shadow-lg" id="reader" />
          <button
            onClick={closeScanner}
            className="mt-4 text-sm text-yellow-400 hover:underline"
          >
            ✖ Close Scanner
          </button>

          {errorMsg && (
            <div className="mt-2 text-red-400 font-semibold text-center">{errorMsg}</div>
          )}
        </div>
      )}


      {productData && !showScanner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white shadow-lg z-40">
          <h3 className="text-lg font-bold text-yellow-400">Product Details</h3>
          <p>
            <strong>ID:</strong> {productData.id}
          </p>
          <p>
            <strong>Name:</strong> {productData.name}
          </p>
          <p>
            <strong>Line Code:</strong> {productData.lineCode}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${productData.status === 'Verified' ? 'bg-green-600' : 'bg-red-600'
                }`}
            >
              {productData.status}
            </span>
          </p>
          <p>
            <strong>Date:</strong> {productData.date}
          </p>
        </div>
      )}


      {isLoading && (
        <div className="absolute top-2 right-2 bg-yellow-600 text-black px-3 py-1 rounded">
          Fetching...
        </div>
      )}
    </div>
  );
};

export default Home;
