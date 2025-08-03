import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MapSelector from '../components/MapSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://localhost:5001';

const TimeLensPage = () => {
  const [location, setLocation] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const years = [2000, 2010, 2020, 2030, 2040, 2050];

  const fetchAllData = useCallback(async (selectedLocation) => {
    if (!selectedLocation) return;
    setIsLoading(true);
    setError('');
    setTimelineData([]);
    try {
      const requests = years.map(year => 
        axios.get(`${API_BASE_URL}/api/timeline?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&year=${year}`)
      );
      const responses = await Promise.all(requests);
      const data = responses.map(res => res.data);
      setTimelineData(data.sort((a, b) => a.year - b.year));
    } catch (err) {
      setError('Gagal memuat data linimasa. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchAllData(location);
    }
  }, [location, fetchAllData]);

  // Kostumisasi Tooltip untuk tema gelap
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-dark-secondary/80 backdrop-blur-sm p-3 border border-white/20 rounded-lg">
          <p className="label text-brand-light">{`${label}`}</p>
          <p className="intro text-brand-green">{`Suhu Rata-rata : ${payload[0].value}°C`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-light">Lensa Waktu Iklim</h1>
        <p className="text-lg text-brand-gray mt-2">Jelajahi perubahan iklim dari masa lalu hingga proyeksi masa depan.</p>
        {/* 👇 KETERANGAN FITUR DITAMBAHKAN DI SINI 👇 */}
        <div className="mt-4 max-w-3xl mx-auto text-sm text-brand-gray border-t border-b border-white/10 py-4 px-6 bg-brand-dark-secondary/20 rounded-lg">
          <p>Fitur ini menggunakan data iklim historis dan model proyeksi ilmiah untuk memvisualisasikan tren perubahan suhu rata-rata tahunan di lokasi pilihan Anda. Ini membantu Anda memahami dampak perubahan iklim secara lokal dari waktu ke waktu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-brand-light">1. Pilih Lokasi</h2>
            <MapSelector onLocationSelect={(loc) => setLocation(loc)} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg p-6 min-h-[400px] backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-brand-light">2. Lihat Hasil Analisis</h2>
            {isLoading && <p className="text-center mt-16 text-brand-gray">Memuat data linimasa...</p>}
            {error && <p className="text-center mt-16 text-red-400">{error}</p>}
            {!isLoading && !error && timelineData.length > 0 && (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="year" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: 'Suhu (°C)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Legend wrapperStyle={{ color: '#E5E7EB' }} />
                  <Line type="monotone" dataKey="averageTemperature" name="Suhu Rata-rata" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8, fill: '#10B981' }} dot={{ stroke: '#10B981', strokeWidth: 1, r: 4, fill: '#111827' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {!isLoading && !error && timelineData.length === 0 && (
              <p className="text-center text-brand-gray mt-16">Silakan pilih lokasi di peta untuk memulai analisis.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeLensPage;