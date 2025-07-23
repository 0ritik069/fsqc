import React, { useEffect, useRef } from 'react';
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

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-800 text-white">
        <h2 className="text-2xl font-bold mb-4">No Data Found</h2>
        <button onClick={() => navigate('/')} className="text-yellow-400 hover:underline">Go Home</button>
      </div>
    );
  }

  
  const columns = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));

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
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
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
                      {value !== undefined ? value : ''}
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