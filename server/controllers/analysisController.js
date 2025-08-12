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

    // 👇 PROMPT YANG JAUH LEBIH SEDERHANA DAN FOKUS PADA TEKS 👇
    const promptForAI = `
      Anda adalah "GreenPredict", seorang ahli mitigasi bencana. Tugas Anda adalah memberikan analisis risiko iklim yang detail DAN meringkasnya menjadi poin-poin kunci berdasarkan data input. Jawab dalam Bahasa Indonesia.

      ### DATA INPUT ###
      **Lokasi:** ${locationName}
      **Jenis Risiko untuk Dianalisis:** "${riskType}"
      **Data Curah Hujan (90 hari terakhir):** Rata-rata ${averagePrecipitation} mm/hari.

      ### TUGAS ANDA ###
      1.  **Tentukan Tingkat Risiko**: Berdasarkan data curah hujan, berikan satu kata kesimpulan: "Rendah", "Sedang", atau "Tinggi". GUNAKAN ATURAN LOGIKA INI: Untuk Banjir, > 5mm/hari = Tinggi, 2-5mm/hari = Sedang, < 2mm/hari = Rendah. Untuk Kekeringan, < 1mm/hari = Tinggi, 1-3mm/hari = Sedang, > 3mm/hari = Rendah.
      2.  **Identifikasi Fakta Kunci**: Pilih satu data paling penting yang mendukung kesimpulan Anda.
      3.  **Pilih Rekomendasi Utama**: Pilih satu aksi mitigasi yang paling berdampak.
      4.  Buat analisis risiko, strategi komunitas, dan strategi UMKM yang detail.

      ### FORMAT OUTPUT (IKUTI DENGAN SANGAT TEPAT) ###
      Hasilkan respons HANYA dalam format JSON yang valid. JANGAN sertakan GeoJSON atau teks lain di luar objek JSON.
      {
        "riskLevel": "...", 
        "keyFact": "...",
        "keyRecommendation": "...",
        "riskAnalysis": "...",
        "communityMitigation": ["...", "..."],
        "msmeStrategy": ["...", "..."]
      }
    `;

    console.log("Mengirim permintaan analisis teks ke AI...");
    const output = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { 
        input: { 
          prompt: promptForAI, 
          temperature: 0.7, 
          max_new_tokens: 2048 // Bisa diturunkan karena tugas lebih ringan
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

    // 👇 PERUBAHAN UTAMA: Backend membuat zona bahaya sendiri secara konsisten 👇
    const dangerZonePolygon = {
      type: "Polygon",
      coordinates: [
        Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * 2 * Math.PI;
          const radius = 0.005; // Radius sekitar 500m
          return [parseFloat(lon) + radius * Math.cos(angle), parseFloat(lat) + radius * Math.sin(angle)];
        })
      ]
    };
    dangerZonePolygon.coordinates[0].push(dangerZonePolygon.coordinates[0][0]); // Menutup poligon

    // Gabungkan hasil analisis teks dari AI dengan GeoJSON buatan backend
    const finalResult = {
      ...textAnalysisResult,
      dangerZoneGeoJSON: dangerZonePolygon
    };
    
    res.status(200).json(finalResult);

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
      { input: { prompt: promptForAI, temperature: 0.6, max_new_tokens: 500 } }
    );
    const resultText = output.join("");
    res.status(200).json({ answer: resultText });
  } catch (error) {
    console.error("Error pada endpoint follow-up:", error);
    res.status(500).json({ message: "Gagal memproses pertanyaan lanjutan." });
  }
};

export { getAnalysis, getFollowUp };