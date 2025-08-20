import React from 'react';
import ReactApexChart from 'react-apexcharts';

const ProgressChart = ({ value, maxValue, unit = "mil M", color = "#10B981" }) => {
  const percentage = (value / maxValue) * 100;
  
  const options = {
    chart: {
      type: 'radialBar',
      height: 200,
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
          size: '70%',
        },
        track: {
          background: '#E5E7EB',
          strokeWidth: '97%',
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: 5,
            color: '#111827',
            fontSize: '22px',
            show: true,
            formatter: function (val) {
              return `${value} ${unit}`;
            }
          }
        }
      }
    },
    fill: {
      colors: [color]
    },
    stroke: {
      lineCap: 'round'
    },
    series: [percentage]
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
      <ReactApexChart 
        options={options} 
        series={options.series} 
        type="radialBar" 
        height={200} 
      />
      <div className="mt-2 text-sm text-gray-600">
        Progress: {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

export default ProgressChart;


