import axios from 'axios';

const getTimelineData = async (req, res) => {
  const { lat, lon, year } = req.query; // Mengambil data dari query parameter

  if (!lat || !lon || !year) {
    return res.status(400).json({ message: "Koordinat dan tahun wajib diisi." });
  }

  const currentYear = new Date().getFullYear();
  let apiUrl;

  // Secara cerdas memilih API berdasarkan tahun
  if (year < currentYear) {
    // Gunakan API data historis (archive)
    apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_mean`;
  } else {
    // Gunakan API data proyeksi masa depan (climate)
    // 👇 PERBAIKAN: Mengganti model iklim ke model yang lebih stabil 👇
    apiUrl = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_mean`;
  }

  try {
    console.log(`Memanggil API untuk tahun ${year}: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    
    const dailyTemps = response.data.daily.temperature_2m_mean;
    // Filter nilai null jika ada, lalu hitung rata-rata
    const validTemps = dailyTemps.filter(temp => temp !== null);

    let averageTemp = null;
    if (validTemps.length > 0) {
        const sum = validTemps.reduce((a, b) => a + b, 0);
        averageTemp = parseFloat((sum / validTemps.length).toFixed(2));
    }

    res.status(200).json({
      year: parseInt(year),
      averageTemperature: averageTemp,
    });

  } catch (error) {
    // 👇 PERBAIKAN: Menambahkan log yang lebih detail untuk debugging 👇
    console.error(`Error mengambil data untuk tahun ${year}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ message: `Gagal mengambil data untuk tahun ${year}.` });
  }
};

export { getTimelineData };