import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Scanner = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerId = "reader";
  const navigate = useNavigate();

  const handleScanSuccess = async (decodedText, html5QrCode) => {
    console.log("Scanned value:", decodedText);
    await html5QrCode.stop();
    try {
      const parts = decodedText.split(',');
      const productId = parts[0];
      const lineCode = parts[1];
      const rawDate = parts[2];
      const [day, month, year] = rawDate.split('/');
      const date = `${year}-${month}-${day}`;
      const url = `https://sisccltd.com/QRWebApp/data?productId=${productId}&date=${date}`;
      console.log("Requesting:", url);
      setIsLoading(true);
      setErrorMsg('');
      const res = await axios.get(url);
      // Navigate to table view with data
      navigate('/table', { state: { data: res.data } });
    } catch (err) {
      console.error("Fetch Error:", err);
      setErrorMsg(`Failed to fetch: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerId);
    const qrConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };
    Html5Qrcode.getCameras().then((devices) => {
      if (devices.length) {
        html5QrCode.start(
          devices[0].id,
          qrConfig,
          (decodedText) => handleScanSuccess(decodedText, html5QrCode)
        );
      } else {
        setErrorMsg("No camera found");
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
      <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
      <div id={scannerId} className="w-[300px] h-[300px] bg-white rounded-lg shadow-lg" />
      {isLoading && <p className="mt-4 text-yellow-400">🔄 Fetching data...</p>}
      {errorMsg && <p className="mt-4 text-red-500">{errorMsg}</p>}
    </div>
  );
};

export default Scanner;
