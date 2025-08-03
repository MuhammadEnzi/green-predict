import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => {
          const city = data.address.city || data.address.town || data.address.county || data.address.state;
          onLocationSelect({ name: city, lat: e.latlng.lat, lon: e.latlng.lng });
        });
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

const MapSelector = ({ onLocationSelect }) => {
  const [selectedCity, setSelectedCity] = useState("");

  const handleLocationSelect = (locationData) => {
      setSelectedCity(locationData.name);
      onLocationSelect(locationData);
  }

  return (
    <div className="mb-2">
        <div className="h-64 md:h-80 w-full rounded-xl overflow-hidden border border-white/10">
            <MapContainer center={[-2.5489, 118.0149]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                {/* PERBAIKAN: Menggunakan tile peta tema terang (default) */}
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onLocationSelect={handleLocationSelect} />
            </MapContainer>
        </div>
        {selectedCity && (
            <p className="text-center mt-3 text-brand-gray">
                Lokasi Terpilih: <span className="font-bold text-brand-light">{selectedCity}</span>
            </p>
        )}
    </div>
  );
};

export default MapSelector;