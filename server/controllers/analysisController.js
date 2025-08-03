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

    // --- LANGKAH 1: Analisis Teks (Panggilan API Pertama) ---
    const promptForTextAnalysis = `
      Anda adalah "GreenPredict", seorang ahli mitigasi bencana. Berdasarkan data input, berikan analisis risiko iklim dan ringkasannya. Jawab dalam Bahasa Indonesia.

      ### DATA INPUT ###
      **Lokasi:** ${locationName}
      **Jenis Risiko:** "${riskType}"
      **Data Curah Hujan:** Rata-rata ${averagePrecipitation} mm/hari.

      ### TUGAS ANDA ###
      1.  Tentukan Tingkat Risiko ("Rendah", "Sedang", "Tinggi").
      2.  Identifikasi Fakta Kunci.
      3.  Pilih Rekomendasi Utama.
      4.  Buat analisis risiko, strategi komunitas, dan strategi UMKM.

      ### FORMAT OUTPUT (HANYA JSON TEKS) ###
      Hasilkan respons HANYA dalam format JSON yang valid. Jangan sertakan GeoJSON.
      {
        "riskLevel": "...", 
        "keyFact": "...",
        "keyRecommendation": "...",
        "riskAnalysis": "...",
        "communityMitigation": ["...", "..."],
        "msmeStrategy": ["...", "..."]
      }
    `;

    console.log("Langkah 1: Mengirim permintaan analisis teks ke AI...");
    const textOutput = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { input: { prompt: promptForTextAnalysis, temperature: 0.7, max_new_tokens: 2048 } }
    );

    let textResultString = textOutput.join("");
    let startIndex = textResultString.indexOf('{');
    let endIndex = textResultString.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Respons teks dari AI tidak valid.");
    let textJsonString = textResultString.substring(startIndex, endIndex + 1);
    const textAnalysisResult = JSON.parse(textJsonString);

    // --- LANGKAH 2: Generasi GeoJSON (Panggilan API Kedua) ---
    const promptForGeoJSON = `
      Anda adalah seorang analis GIS. Berdasarkan analisis risiko berikut, buatkan sebuah poligon GeoJSON sederhana (5-10 titik) untuk zona bahaya utama.

      ### KONTEKS ANALISIS ###
      **Lokasi:** ${locationName}
      **Jenis Risiko:** ${riskType}
      **Analisis:** ${textAnalysisResult.riskAnalysis}

      ### TUGAS ANDA ###
      Buat HANYA objek GeoJSON untuk "dangerZoneGeoJSON". Pastikan titik pertama dan terakhir sama.

      ### CONTOH OUTPUT ###
      { "type": "Polygon", "coordinates": [[[106.82, -6.20], [106.83, -6.21], [106.82, -6.22], [106.81, -6.21], [106.82, -6.20]]] }
    `;

    console.log("Langkah 2: Mengirim permintaan GeoJSON ke AI...");
    const geoJsonOutput = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { input: { prompt: promptForGeoJSON, temperature: 0.5, max_new_tokens: 2048 } }
    );
    
    let geoJsonResultString = geoJsonOutput.join("");
    startIndex = geoJsonResultString.indexOf('{');
    endIndex = geoJsonResultString.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Respons GeoJSON dari AI tidak valid.");
    let geoJsonString = geoJsonResultString.substring(startIndex, endIndex + 1);
    const dangerZoneResult = JSON.parse(geoJsonString);

    // --- LANGKAH 3: Gabungkan Hasil & Kirim ke Frontend ---
    const finalResult = {
      ...textAnalysisResult,
      dangerZoneGeoJSON: dangerZoneResult
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
