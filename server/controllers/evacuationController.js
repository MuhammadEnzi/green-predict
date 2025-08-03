import axios from 'axios';

// Fungsi helper untuk menghitung jarak antara dua titik koordinat (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam km
}

const getEvacuationPlan = async (req, res) => {
  // Menerima koordinat pengguna dan poligon zona bahaya dari body permintaan
  const { lat, lon, dangerZonePolygon } = req.body;

  if (!lat || !lon || !dangerZonePolygon) {
    return res.status(400).json({ message: "Koordinat pengguna dan poligon zona bahaya wajib diisi." });
  }

  try {
    // 1. Mencari Titik Aman (Rumah Sakit & Shelter) via Overpass API dalam radius 5km
    const overpassQuery = `[out:json];(node["amenity"="hospital"](around:5000,${lat},${lon});node["emergency"="shelter"](around:5000,${lat},${lon}););out body;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const overpassResponse = await axios.get(overpassUrl);
    
    // Memproses hasil dan mengurutkannya berdasarkan jarak terdekat
    let resources = overpassResponse.data.elements.map(el => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      type: el.tags.amenity === 'hospital' ? 'hospital' : 'shelter',
      name: el.tags.name || `Fasilitas Darurat`,
      distance: calculateDistance(lat, lon, el.lat, el.lon)
    }));
    resources.sort((a, b) => a.distance - b.distance);

    if (resources.length === 0) {
      return res.status(404).json({ message: "Tidak ditemukan fasilitas darurat dalam radius 5km." });
    }

    // 2. Loop untuk mencoba mencari rute ke 5 tujuan terdekat
    for (let i = 0; i < Math.min(5, resources.length); i++) {
      const destination = resources[i];
      try {
        // Menyiapkan payload untuk OpenRouteService, termasuk poligon bahaya dari AI
        const orsPayload = {
          coordinates: [[lon, lat], [destination.lon, destination.lat]],
          options: { avoid_polygons: dangerZonePolygon }
        };
        const orsHeaders = { 'Authorization': process.env.ORS_API_KEY, 'Content-Type': 'application/json' };
        
        console.log(`Mencoba rute ke ${destination.name} dengan zona bahaya dari AI...`);
        const orsResponse = await axios.post('https://api.openrouteservice.org/v2/directions/driving-car/geojson', orsPayload, { headers: orsHeaders });
        
        // Memformat ulang koordinat rute agar sesuai dengan Leaflet [lat, lon]
        const routeCoordinates = orsResponse.data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);

        console.log(`Rute berhasil ditemukan ke ${destination.name}!`);
        // Jika rute berhasil ditemukan, kirim respons dan hentikan proses
        return res.status(200).json({
          userLocation: [lat, lon],
          resources: resources,
          safeRoute: routeCoordinates,
          dangerZone: dangerZonePolygon.coordinates[0].map(coord => [coord[1], coord[0]]), // Kirim kembali poligon untuk dirender
          destinationInfo: { name: destination.name, type: destination.type, distance: destination.distance.toFixed(2) }
        });

      } catch (routeError) {
        // Jika rute ke tujuan saat ini gagal, catat dan lanjutkan ke tujuan berikutnya
        console.warn(`Gagal menemukan rute ke ${destination.name}. Mencoba tujuan berikutnya...`);
        if (i === Math.min(5, resources.length) - 1) {
          // Jika ini adalah percobaan terakhir dan masih gagal, lempar error
          throw new Error("Tidak ada rute yang dapat dijangkau ditemukan.");
        }
      }
    }
    
    // Baris ini seharusnya tidak tercapai, tetapi sebagai fallback
    throw new Error("Gagal menemukan rute aman.");

  } catch (error) {
    console.error("Error di evacuationController:", error.message);
    res.status(500).json({ message: "Gagal membuat rencana evakuasi." });
  }
};

export { getEvacuationPlan };