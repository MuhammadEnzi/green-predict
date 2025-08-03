import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';

// Ikon kustom untuk rumah sakit dan shelter
const hospitalIcon = new L.Icon({ iconUrl: 'https://img.icons8.com/office/40/hospital-3.png', iconSize: [32, 32] });
const shelterIcon = new L.Icon({ iconUrl: 'https://img.icons8.com/plasticine/100/camping-tent.png', iconSize: [32, 32] });

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EvacuationPage = () => {
  const location = useLocation();
  const { userLocation, dangerZone } = location.state || {};

  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userLocation || !dangerZone) {
      setError('Data lokasi atau zona bahaya tidak lengkap. Silakan kembali.');
      setIsLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const payload = {
          lat: userLocation.lat,
          lon: userLocation.lon,
          dangerZonePolygon: dangerZone
        };
        const response = await axios.post(`${API_BASE_URL}/api/evacuation`, payload);
        setPlan(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat rencana evakuasi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [userLocation, dangerZone]);

  if (!userLocation && !isLoading) {
    return (
      <div className="text-center text-red-400">
        <p>{error}</p>
        <Link to="/analyze" className="text-brand-green underline ml-2">Kembali ke Halaman Analisis</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand-light">Rencana Evakuasi Cerdas</h1>
        <div className="mt-4 max-w-3xl mx-auto text-sm text-brand-gray border-t border-b border-white/10 py-4 px-6 bg-brand-dark-secondary/20 rounded-lg">
          <p>Berdasarkan analisis AI, peta ini menampilkan zona bahaya (merah), titik aman terdekat, dan rute evakuasi teraman (hijau) yang secara cerdas menghindari area berbahaya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg p-4 h-[70vh] backdrop-blur-sm">
          {isLoading && <div className="h-full flex items-center justify-center"><p className="text-brand-gray">Mencari rute teraman...</p></div>}
          {error && <div className="h-full flex items-center justify-center"><p className="text-red-400">{error}</p></div>}
          {plan && (
            <MapContainer center={plan.userLocation} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polygon positions={plan.dangerZone} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} />
              <Polyline positions={plan.safeRoute} pathOptions={{ color: '#10B981', weight: 5 }} />
              <Marker position={plan.userLocation}><Popup>Lokasi Anda</Popup></Marker>
              {plan.resources.map(resource => (
                <Marker 
                  key={resource.id} 
                  position={[resource.lat, resource.lon]} 
                  icon={resource.type === 'hospital' ? hospitalIcon : shelterIcon}
                ><Popup>{resource.name} ({resource.type})</Popup></Marker>
              ))}
            </MapContainer>
          )}
        </div>
        
        <div className="lg:col-span-1">
            <div className="bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg p-6 backdrop-blur-sm h-full">
                <h2 className="text-xl font-semibold text-brand-light mb-4">Detail Rute</h2>
                {plan?.destinationInfo ? (
                    <div className="space-y-4 text-brand-light">
                        <div>
                            <p className="text-sm text-brand-gray">Tujuan Terdekat:</p>
                            <p className="text-lg font-bold text-brand-green">{plan.destinationInfo.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-brand-gray">Jenis Fasilitas:</p>
                            <p className="capitalize">{plan.destinationInfo.type === 'hospital' ? 'Rumah Sakit' : 'Posko Pengungsian'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-brand-gray">Perkiraan Jarak:</p>
                            <p>{plan.destinationInfo.distance} km</p>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <h3 className="font-semibold text-brand-light mb-2">Instruksi Keselamatan:</h3>
                            <ul className="list-disc list-inside text-sm text-brand-gray space-y-1">
                                <li>Ikuti jalur hijau di peta.</li>
                                <li>Hindari area yang diarsir merah.</li>
                                <li>Bawa dokumen penting dan perbekalan darurat.</li>
                                <li>Tetap waspada dan hubungi pihak berwenang jika perlu.</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <p className="text-brand-gray">Informasi detail akan muncul di sini setelah rute berhasil ditemukan.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EvacuationPage;