import Replicate from "replicate";
import axios from 'axios';

const getAnalysis = async (req, res) => {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const { lat, lon, locationName, riskType } = req.body;

  if (!lat || !lon || !locationName || !riskType) {
    return res.status(400).json({ message: 'Data lokasi, jenis risiko, dan koordinat wajib diisi.' });
  }

  try {
    const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=auto&past_days=90`;
    const weatherResponse = await axios.get(weatherApiUrl);
    const dailyPrecipitation = weatherResponse.data.daily.precipitation_sum;
    const totalPrecipitation = dailyPrecipitation.reduce((a, b) => a + b, 0);
    const averagePrecipitation = (totalPrecipitation / dailyPrecipitation.length).toFixed(2);

    // 👇 PERUBAHAN UTAMA: Struktur prompt baru yang lebih logis 👇
    const promptForAI = `
      ### PERAN & ATURAN SISTEM ###
      Anda adalah "GreenPredict", seorang ahli mitigasi bencana. Tugas utama Anda adalah mengisi template JSON berikut berdasarkan data yang diberikan. Jawab dalam Bahasa Indonesia.
      Aturan terpenting: Hasilkan HANYA objek JSON yang valid. Jangan sertakan teks pembuka, penutup, atau penjelasan apapun di luar objek JSON.

      ### TEMPLATE FORMAT OUTPUT JSON ###
      {
        "riskLevel": "...", 
        "keyFact": "...",
        "keyRecommendation": "...",
        "riskAnalysis": "...",
        "communityMitigation": ["...", "..."],
        "msmeStrategy": ["...", "..."],
        "dangerZoneGeoJSON": {
          "type": "Polygon",
          "coordinates": [[[...]]]
        }
      }

      ### DATA INPUT PENGGUNA ###
      **Lokasi:** ${locationName}
      **Jenis Risiko untuk Dianalisis:** "${riskType}"
      **Data Curah Hujan (90 hari terakhir):** Rata-rata ${averagePrecipitation} mm/hari.

      ### TUGAS ANDA ###
      Sekarang, isi template JSON di atas berdasarkan DATA INPUT PENGGUNA.
      Untuk "riskLevel", gunakan aturan logika ini: Untuk Banjir, > 5mm/hari = Tinggi, 2-5mm/hari = Sedang, < 2mm/hari = Rendah. Untuk Kekeringan, < 1mm/hari = Tinggi, 1-3mm/hari = Sedang, > 3mm/hari = Rendah.
      Untuk "dangerZoneGeoJSON", buat poligon lingkaran sederhana (8-16 titik) dengan radius sekitar 500 meter (0.005 derajat) di sekitar titik koordinat input.
    `;

    console.log("Mengirim permintaan analisis dengan prompt berbasis peran...");
    const output = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { 
        input: { 
          prompt: promptForAI, 
          temperature: 0.7, 
          max_new_tokens: 4096
        } 
      }
    );

    const resultString = output.join("");
    console.log("--- RESPONS MENTAH DARI AI ---", resultString);
    
    const startIndex = resultString.indexOf('{');
    const endIndex = resultString.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Respons AI tidak valid.");
    
    const jsonString = resultString.substring(startIndex, endIndex + 1);
    const textAnalysisResult = JSON.parse(jsonString);

    // Fallback jika AI gagal membuat GeoJSON yang valid
    if (!textAnalysisResult.dangerZoneGeoJSON || !textAnalysisResult.dangerZoneGeoJSON.coordinates) {
        console.warn("AI gagal menghasilkan GeoJSON. Membuat poligon fallback.");
        const dangerZonePolygon = {
          type: "Polygon",
          coordinates: [
            Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * 2 * Math.PI;
              const radius = 0.005;
              return [parseFloat(lon) + radius * Math.cos(angle), parseFloat(lat) + radius * Math.sin(angle)];
            })
          ]
        };
        dangerZonePolygon.coordinates[0].push(dangerZonePolygon.coordinates[0][0]);
        textAnalysisResult.dangerZoneGeoJSON = dangerZonePolygon;
    }
    
    res.status(200).json(textAnalysisResult);

  } catch (error) {
    console.error("Error di getAnalysis:", error);
    res.status(500).json({ message: "Gagal memproses analisis." });
  }
};

const getFollowUp = async (req, res) => {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  const { conversationHistory, newQuestion } = req.body;
  if (!conversationHistory || !newQuestion) {
    return res.status(400).json({ message: "Riwayat percakapan dan pertanyaan baru wajib diisi." });
  }
  const formattedHistory = conversationHistory.map(msg => {
    if (msg.role === 'user') {
      return `Pengguna: ${msg.content.replace(/<[^>]*>/g, '')}`;
    } else {
      return `AI: (Memberikan analisis risiko dan rekomendasi mitigasi)`;
    }
  }).join("\n");
  const promptForAI = `
    Anda adalah asisten AI GreenPredict yang cerdas dan membantu. Lanjutkan percakapan berdasarkan riwayat dan pertanyaan baru dari pengguna. Jawab dengan ringkas dan langsung ke intinya dalam Bahasa Indonesia.
    ### RIWAYAT PERCAKAPAN SEBELUMNYA ###
    ${formattedHistory}
    ### PERTANYAAN BARU DARI PENGGUNA ###
    "${newQuestion}"
    ### JAWABAN ANDA ###
  `;
  try {
    console.log("Mengirim permintaan follow-up ke AI...");
    const output = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { input: { prompt: promptForAI, temperature: 0.6, max_new_tokens: 2048 } }
    );
    const resultText = output.join("");
    res.status(200).json({ answer: resultText });
  } catch (error) {
    console.error("Error pada endpoint follow-up:", error);
    res.status(500).json({ message: "Gagal memproses pertanyaan lanjutan." });
  }
};

export { getAnalysis, getFollowUp };