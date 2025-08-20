import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from "html5-qrcode";


const getCellStyle = (col, value) => {

  if (typeof value === 'number') {
    if (value >= 0.7 && value <= 1.0) {
      return 'bg-yellow-300 text-black font-bold';
    }
    return 'bg-green-700 text-white';
  }
 
  return 'bg-white text-black';
};

const TableView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data || [];

  // Sanitize rows: replace blank/unnamed first key with a stable key 'col004'.
  // Also normalize any key whose numeric part equals '004' to 'col004'.
  const sanitizeRow = (row) => {
    if (!row || typeof row !== 'object') return row;
    const next = { ...row };
    Object.keys(row).forEach((key) => {
      const trimmed = (key ?? '').toString();
      const digits = trimmed.replace(/\D+/g, '');
      const isBlank = trimmed.trim() === '';
      const is004 = digits === '004';
      if (isBlank || is004) {
        // Move value to 'col004'
        if (next.col004 === undefined) next.col004 = row[key];
        delete next[key];
      }
    });
    return next;
  };

  const sanitizedData = useMemo(() => data.map(sanitizeRow), [data]);

  // Column order: put 'col004' first if it exists; then the rest in natural order
  const allKeys = useMemo(
    () => Array.from(new Set(sanitizedData.flatMap((obj) => Object.keys(obj)))),
    [sanitizedData]
  );
  const orderedKeys = useMemo(() => {
    const others = allKeys.filter((k) => k !== 'col004');
    return allKeys.includes('col004') ? ['col004', ...others] : others;
  }, [allKeys]);

  // Removed sorting functionality - data will be displayed in original order
  const sortedData = useMemo(() => [...sanitizedData], [sanitizedData]);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-800 text-white">
        <h2 className="text-2xl font-bold mb-4">No Data Found</h2>
        <button onClick={() => navigate('/')} className="text-yellow-400 hover:underline">Go Home</button>
      </div>
    );
  }

  
  const columns = orderedKeys;














  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-800 text-white px-4">
      <h2 className="text-2xl font-bold mb-4">Batch Data Table</h2>
      <div className="overflow-x-auto w-full max-w-4xl">
        <table className="min-w-full rounded-lg shadow-lg border border-gray-400">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 border-b border-gray-400 font-extrabold text-lg text-black bg-gray-200 uppercase tracking-wider text-center"
                >
                  {col === 'col004' ? '004' : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-100' : 'bg-gray-300'}>
                {columns.map((col) => {
                  const value = row[col];
                  // Try to parse as number for highlighting
                  let parsed = value;
                  if (typeof value === 'string' && !isNaN(Number(value))) {
                    parsed = Number(value);
                  }
                  return (
                    <td
                      key={col}
                      className={`px-4 py-2 border-b border-gray-300 text-center font-mono ${getCellStyle(col, parsed)}`}
                    >
                      {value !== undefined && value !== null && value !== '' ? value : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => navigate('/')} className="mt-6 text-yellow-400 hover:underline">Go Home</button>
    </div>
  );
};

export default TableView; 



 // hum is project me graph dikhane h jesa mene tumhe ss diya h wese is project me jab hum qr scan krte h tab  tab  do array mil rhe h
    // ek h limits dusra h allrecords  to pehle array jo values mil rhi h usme ye batya gya h ki kiska value dikhai h kiska nhi jese isme 
    // lse value lie value mil rhi h wo h hmari lower and upper value critica jo h wo h dicied value ki dikhnai h ya nhi table me
    

    // 