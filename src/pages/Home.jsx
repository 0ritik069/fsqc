import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import logo from '../assets/qr-app.png';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const Home = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [productData, setProductData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [scannerRunning, setScannerRunning] = useState(false);
  const hasScannedRef = useRef(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    if (!showScanner) return;

    const scannerId = 'reader';
    const html5QrCode = new Html5Qrcode(scannerId);
    setHtml5QrCodeInstance(html5QrCode);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = async (decodedText) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true; 

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
        setProductData(res.data);
        console.log(res);
        setErrorMsg('');

        try {
          if (scannerRunning) {
            await html5QrCode.stop();
            setScannerRunning(false);
            console.log('Scanner stopped after success');
          }
        } catch (e) {
          console.warn('Scanner stop error (ignored):', e.message);
        }

        setShowScanner(false);
      } catch (err) {
        setErrorMsg(`Error: ${err.message || 'Failed to fetch data'}`);
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

        html5QrCode.start(cameraId, config, onScanSuccess)
          .then(() => {
            setScannerRunning(true);
            console.log('Scanner started');
          })
          .catch(() => {
            setErrorMsg('Failed to start camera');
          });
      })
      .catch(() => {
        setErrorMsg('Camera access error');
      });

    return () => {
      if (scannerRunning) {
        html5QrCode.stop()
          .then(() => {
            html5QrCode.clear();
            console.log('Scanner stopped on unmount');
          })
          .catch((err) => {
            console.warn('Cleanup stop error:', err.message);
          });
      }
    };
  }, [showScanner]);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [productData]);

  const closeScanner = async () => {
    if (html5QrCodeInstance && scannerRunning) {
      try {
        await html5QrCodeInstance.stop();
        await html5QrCodeInstance.clear();
        setScannerRunning(false);
        console.log('Scanner manually closed');
      } catch (e) {
        console.warn('Scanner stop error:', e.message);
      }
    }
    setShowScanner(false);
    setErrorMsg('');
  };

  const getAllColumns = (dataArr) => {
    const cols = new Set();
    dataArr.forEach(obj => Object.keys(obj).forEach(key => cols.add(key)));
    return Array.from(cols);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return d.toLocaleString();
    return d.toLocaleString();
  };

  // New function to render gauge charts using ApexCharts
  const renderGaugeChart = (label, value, min, max, isInRange) => {
    const safeMin = Number(min);
    const safeMax = Number(max);
    const safeValue = Number(value);
    const low = Math.min(safeMin, safeMax);
    const high = Math.max(safeMin, safeMax);
    
    // Calculate percentage for the gauge
    let percentage = 0;
    if (isFinite(safeValue) && isFinite(low) && isFinite(high) && high !== low) {
      percentage = ((safeValue - low) / (high - low)) * 100;
    }
    
    // Ensure percentage is between 0 and 100, but show at least 5% if value exists
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const displayPercentage = safeValue > 0 ? Math.max(clampedPercentage, 5) : 0;
    
    const options = {
      chart: {
        type: 'radialBar',
        height: 140,
        offsetY: 0,
        sparkline: {
          enabled: true
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 15,
            size: '65%',
          },
          track: {
            background: '#374151',
            strokeWidth: '97%',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              offsetY: 5,
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 'bold',
              show: true,
              formatter: function (val) {
                // Show actual value, not percentage
                return isFinite(safeValue) && safeValue !== 0 ? safeValue.toFixed(2) : '0.00';
              }
            }
          }
        }
      },
      fill: {
        colors: [isInRange ? '#22c55e' : '#ef4444']
      },
      stroke: {
        lineCap: 'round',
        width: 3
      },
      series: [displayPercentage]
    };

    return (
      <div key={label} className="bg-gray-800 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-white mb-2">{label}</h3>
        
        <ReactApexChart 
          options={options} 
          series={options.series} 
          type="radialBar" 
          height={140} 
        />
        

      </div>
    );
  };

  // Helpers
  const normalizeKey = (s) => (s ?? '').toString().trim().toUpperCase();
  const findLimitById = (id) => {
    if (!productData || !Array.isArray(productData.limits)) return null;
    const normId = normalizeKey(id);
    return productData.limits.find(l => normalizeKey(l.caracteristicaid) === normId) || null;
  };
  const sortRecordsByDateAsc = (records) => {
    return [...records].sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
  };
  const findValueByAliases = (row, aliases) => {
    const keys = Object.keys(row || {});
    for (const alias of aliases) {
      const n = normalizeKey(alias);
      const found = keys.find(k => normalizeKey(k) === n || normalizeKey(k).includes(n));
      if (found) return row[found];
    }
    if (row && row['004'] !== undefined) return row['004'];
    return undefined;
  };

  const getValueByNumericKey = (row, numericKey) => {
    if (!row) return undefined;
    
    // First try exact match
    if (row[numericKey] !== undefined) {
      return row[numericKey];
    }
    
    // Try numeric key matching
    const wanted = (numericKey || '').toString().replace(/\D+/g, '');
    const keys = Object.keys(row);
    
    for (const key of keys) {
      const digits = key.toString().replace(/\D+/g, '');
      if (digits === wanted) {
        return row[key];
      }
    }
    
    // Try partial matching for special cases
    if (numericKey === '004' && row[''] !== undefined) {
      return row['']; // Handle blank key case
    }
    
    return undefined;
  };

  // Function to render critical features dashboard
  const renderCriticalFeaturesDashboard = () => {
    if (!productData || !Array.isArray(productData.allRecords) || !Array.isArray(productData.limits)) {
      return null;
    }

    const all = productData.allRecords;
    if (!all.length) return null;

    const latest = [...all].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))[0] || all[0];
    
    // Get product ID from the first record
    const productId = latest?.productoid || latest?.productid || 'N/A';

    const dynamicDefs = productData.limits
      .filter(l => l && l.caracteristicaid && String(l.critica).trim() === '1')
      .map(l => ({
        label: (l.caracteristicaid || '').toString().trim(),
        min: l.lie,
        max: l.lse,
      }));

    return (
      <div className="w-full max-w-6xl mx-auto mt-8 bg-gray-900 rounded-lg shadow-lg p-6">
        {/* Product ID Display */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">Product ID</h2>
          <div className="text-2xl font-bold text-white bg-gray-800 px-6 py-3 rounded-lg inline-block">
            {productId}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dynamicDefs.map((def) => {
            const keys = Object.keys(latest || {});
            const target = normalizeKey(def.label);
            const foundKey = keys.find(k => {
              const nk = normalizeKey(k);
              return nk === target || nk.includes(target) || target.includes(nk);
            });
            let value = foundKey ? latest[foundKey] : undefined;
            if (value === undefined || value === null) {
              value = getValueByNumericKey(latest, def.label);
            }
            const v = Number(value);
            const low = Math.min(Number(def.min), Number(def.max));
            const high = Math.max(Number(def.min), Number(def.max));
            const inRange = isFinite(v) && isFinite(low) && isFinite(high) && v >= low && v <= high;
            
            // Debug logging
            console.log(`Chart ${def.label}:`, {
              value: value,
              numericValue: v,
              min: def.min,
              max: def.max,
              inRange: inRange,
              foundKey: foundKey
            });
            
            return renderGaugeChart(def.label, value, def.min, def.max, inRange);
          })}
        </div>
      </div>
    );
  };

  // Function to render data table from allRecords
  const renderDataTable = () => {
    if (!productData || !productData.allRecords || !Array.isArray(productData.allRecords)) {
      return null;
    }

    // Sort by date DESC and sanitize '004' to 'col004'
    const sortedDesc = [...productData.allRecords]
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    const sanitizeRowFor004 = (row) => {
      if (!row || typeof row !== 'object') return row;
      const next = { ...row };
      Object.keys(row).forEach((key) => {
        const keyStr = (key ?? '').toString();
        const digits = keyStr.replace(/\D+/g, '');
        const isBlank = keyStr.trim() === '';
        const is004 = digits === '004';
        if (isBlank || is004) {
          if (next.col004 === undefined) next.col004 = row[key];
          delete next[key];
        }
      });
      return next;
    };
    let dataToShow = sortedDesc.map(sanitizeRowFor004);
    
    if (dataToShow.length === 0) {
      return null;
    }

    // Build columns: SR, fecha, '004' then the rest
    const keysSet = new Set();
    dataToShow.forEach(row => Object.keys(row).forEach(k => keysSet.add(k)));
    let columns = Array.from(keysSet);
    const removeCols = new Set([
      'estacionid',
      'maquinaid',
      'productid',
      'productoid',
      'critica',
      'lie',
      'lse',
      'caracteristicaid',
      'presion',
    ]);
    columns = columns.filter(c => {
      const name = (c ?? '').toString().trim().toUpperCase();
      for (const rc of removeCols) {
        if (name === (rc ?? '').toString().trim().toUpperCase()) return false;
      }
      return true;
    });
    const remaining = columns
      .filter(c => (c ?? '').toString().trim().toUpperCase() !== 'FECHA')
      .filter(c => c !== 'col004');
    remaining.sort();
    const finalColumns = ['SR', 'fecha', '004', ...remaining];

    // No sorting - data displayed in original order

    const paginatedData = dataToShow.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(dataToShow.length / rowsPerPage);

    return (
      <div className="w-full max-w-6xl mx-auto mt-8 bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">
           Data Table 
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg border border-gray-400">
            <thead>
              <tr>
                {finalColumns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 border-b border-gray-400 font-bold text-sm text-black bg-gray-200 uppercase text-center"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr 
                    key={idx} 
                    className={`${globalIndex % 2 === 0 ? 'bg-gray-100' : 'bg-gray-300'}`}
                  >
                    {finalColumns.map((col) => {
                      let displayValue = '-';
                      if (col === 'SR') {
                        displayValue = globalIndex;
                      } else if (col === 'fecha') {
                        displayValue = formatDate(row.fecha);
                      } else if (col === '004') {
                        const v = row.col004;
                        displayValue = v !== undefined && v !== null && v !== '' ? String(v) : '-';
                      } else {
                        const raw = row[col];
                        displayValue = raw !== undefined && raw !== null ? String(raw) : '-';
                      }
                      return (
                        <td key={col} className="px-4 py-2 border-b border-gray-300 text-center font-mono text-black">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-sm text-gray-300">
              Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, dataToShow.length)} of {dataToShow.length} records
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto flex-nowrap py-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-800 text-yellow-300 hover:bg-yellow-600'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const paginatedData = Array.isArray(productData)
    ? productData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : [];
  const totalPages = Array.isArray(productData)
    ? Math.ceil(productData.length / rowsPerPage)
    : 1;

  
  
  
  
   

  return (
    <div className="relative">
      
      {!showScanner && !productData && (
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-800 text-white flex flex-col items-center justify-center px-4">
          <img src={logo} alt="FSQC Logo" className="w-48 h-48 rounded-xl shadow-xl mb-4" />
          <h1 className="text-4xl font-extrabold text-yellow-600">FSQC Web App</h1>
          <p className="text-center text-sm text-gray-300 max-w-sm my-4">
            A fast and secure web app for verifying information from QR codes on Android & iOS browsers.
          </p>
          <button
            onClick={() => {
              setProductData(null);
              setErrorMsg('');
              hasScannedRef.current = false; 
              setShowScanner(true);
            }}
            className="bg-red-800 hover:bg-red-700 px-8 py-3 rounded-full font-semibold text-white shadow-md"
          >
            Start Scanning
          </button>
        </div>
      )}

    
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 px-4">
          <div className="flex items-center justify-center w-full" style={{ minHeight: 320 }}>
            <div
              id="reader"
              className="bg-white rounded-lg shadow-lg"
              style={{
                width: 'min(90vw, 350px)',
                height: 'min(90vw, 350px)',
                maxWidth: 400,
                maxHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </div>
          <button onClick={closeScanner} className="mt-4 text-sm text-yellow-400 hover:underline">
            ✖ Close Scanner
          </button>
          {errorMsg && <div className="mt-2 text-red-400 font-semibold text-center">{errorMsg}</div>}
        </div>
      )}

      {/* Render Critical Features Dashboard */}
      {renderCriticalFeaturesDashboard()}

      {/* Render Data Table from allRecords */}
      {renderDataTable()}

      {/* Render Array Table (fallback for old format) */}
      {Array.isArray(productData) && productData.length > 0 && !showScanner && !productData.limits && (
        <div className="w-full max-w-5xl mx-auto mt-8 bg-gray-900 rounded-lg shadow-lg p-4 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Batch Data Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-max rounded-lg border border-gray-400">
              <thead>
                <tr>
                  {getAllColumns(productData).map((col) => (
                    <th key={col} className="px-4 py-3 border-b border-gray-400 font-bold text-sm text-black bg-gray-200 uppercase text-center">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className={((currentPage - 1) * rowsPerPage + idx) % 2 === 0 ? 'bg-gray-100' : 'bg-gray-300'}>
                    {getAllColumns(productData).map((col) => (
                      <td key={col} className="px-4 py-2 border-b border-gray-300 text-center font-mono text-black">
                        {col === 'fecha' ? formatDate(row[col]) : (row[col] !== undefined && row[col] !== null ? String(row[col]) : '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-sm text-gray-300">
                Showing {(currentPage - 1) * rowsPerPage + 1}
                -{Math.min(currentPage * rowsPerPage, productData.length)} of {productData.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto flex-nowrap py-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-800 text-yellow-300 hover:bg-yellow-600'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}
              >
                Next
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setProductData(null);
                setErrorMsg('');
                hasScannedRef.current = false;
                setShowScanner(true);
                setCurrentPage(1);
              }}
              className="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded-full font-semibold text-black shadow-md"
            >
              Scan Again
            </button>
          </div>
        </div>
      )}

      {/* Render Object Details */}
      {productData && !Array.isArray(productData) && !showScanner && !productData.limits && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white shadow-lg z-40">
          <h3 className="text-lg font-bold text-yellow-400">Product Details</h3>
          {Object.entries(productData).map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {String(value)}</p>
          ))}
        </div>
      )}

      {/* Scan Again Button for new format */}
      {productData && (productData.limits || productData.allRecords) && !showScanner && (
        <div className="flex justify-center mt-8 mb-8">
          <button
            onClick={() => {
              setProductData(null);
              setErrorMsg('');
              hasScannedRef.current = false;
              setShowScanner(true);
              setCurrentPage(1);
            }}
            className="bg-yellow-600 hover:bg-yellow-500 px-8 py-3 rounded-full font-semibold text-black shadow-md"
          >
            Scan Again
          </button>
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
