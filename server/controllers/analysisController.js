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

    // 👇 PERUBAHAN UTAMA: Prompt sekarang berisi beberapa contoh 👇
    const promptForAI = `
      Anda adalah "GreenPredict", seorang ahli mitigasi bencana. Tugas Anda adalah memberikan analisis risiko iklim yang detail DAN meringkasnya menjadi poin-poin kunci. Jawab dalam Bahasa Indonesia.

      ### DATA INPUT ###
      **Lokasi:** ${locationName}
      **Jenis Risiko untuk Dianalisis:** "${riskType}"
      **Data Curah Hujan (90 hari terakhir):** Rata-rata ${averagePrecipitation} mm/hari.

      ### TUGAS ANDA ###
      Buatlah analisis risiko, strategi mitigasi komunitas, dan strategi UMKM berdasarkan data di atas. Ikuti format JSON dari contoh-contoh di bawah ini dengan tepat.

      ### CONTOH-CONTOH OUTPUT ###

      **Contoh 1 (Untuk Risiko Banjir):**
      {
        "riskLevel": "Tinggi",
        "keyFact": "Curah hujan rata-rata yang signifikan meningkatkan potensi genangan air.",
        "keyRecommendation": "Prioritaskan normalisasi dan pembersihan rutin saluran drainase.",
        "riskAnalysis": "Dengan curah hujan rata-rata yang signifikan dan kemungkinan topografi dataran rendah, lokasi ini memiliki risiko tinggi terhadap banjir genangan, terutama saat puncak musim hujan.",
        "communityMitigation": [
          "Melakukan normalisasi dan pembersihan rutin saluran drainase primer dan sekunder.",
          "Membuat lubang resapan biopori komunal di area fasilitas umum.",
          "Menggalakkan penanaman pohon dengan daya serap air tinggi seperti Trembesi."
        ],
        "msmeStrategy": [
          "Bagi UMKM kuliner, pastikan area penyimpanan bahan baku dan peralatan elektronik berada di rak yang tinggi.",
          "Membuat rencana kontingensi untuk operasional jarak jauh jika akses ke lokasi usaha terganggu."
        ],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[106.82, -6.20], [106.83, -6.21], [106.82, -6.22], [106.81, -6.21], [106.82, -6.20]]] }
      }

      **Contoh 2 (Untuk Risiko Kekeringan):**
      {
        "riskLevel": "Sedang",
        "keyFact": "Curah hujan yang rendah menekan ketersediaan sumber daya air bersih.",
        "keyRecommendation": "Membangun embung atau waduk kecil untuk menampung air hujan.",
        "riskAnalysis": "Rata-rata curah hujan yang sangat rendah menunjukkan adanya tekanan signifikan pada sumber daya air. Lokasi ini berisiko sedang mengalami kekeringan agrikultural dan krisis air bersih jika musim kemarau berlangsung lebih lama dari biasanya.",
        "communityMitigation": [
          "Membangun embung atau waduk kecil untuk menampung air hujan sebagai cadangan.",
          "Mempromosikan penggunaan teknik irigasi tetes (drip irrigation) bagi petani untuk menghemat air.",
          "Mengadakan kampanye hemat air di tingkat rumah tangga."
        ],
        "msmeStrategy": [
          "UMKM agrikultur disarankan untuk menanam varietas tanaman yang lebih tahan kekeringan.",
          "Bagi usaha yang bergantung pada air (cth: cuci mobil, laundry), buatlah sistem daur ulang air sederhana."
        ],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[107.60, -6.90], [107.61, -6.91], [107.60, -6.92], [107.59, -6.91], [107.60, -6.90]]] }
      }

      ### OUTPUT ANDA (HANYA JSON) ###
      Hasilkan respons HANYA dalam format JSON yang valid berdasarkan DATA INPUT di atas. Jangan sertakan teks pembuka, penutup, atau penjelasan apapun di luar objek JSON.
    `;

    console.log("Mengirim permintaan analisis dengan prompt Few-Shot...");
    const output = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { 
        input: { 
          prompt: promptForAI, 
          temperature: 0.7, 
          max_new_tokens: 4096 // Kita bisa gunakan nilai yang lebih moderat sekarang
        } 
      }
    );

    const resultString = output.join("");
    console.log("--- RESPONS MENTAH DARI AI ---", resultString);
    
    const startIndex = resultString.indexOf('{');
    const endIndex = resultString.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Respons AI tidak valid.");
    
    const jsonString = resultString.substring(startIndex, endIndex + 1);
    const parsedResult = JSON.parse(jsonString);
    
    res.status(200).json(parsedResult);

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
    console.log("Mengirim permintaan follow-up ke Replicate API...");
    const output = await replicate.run(
      "ibm-granite/granite-3.3-8b-instruct",
      { input: { prompt: promptForAI, temperature: 0.6, max_new_tokens: 4000 } }
    );
    const resultText = output.join("");
    res.status(200).json({ answer: resultText });
  } catch (error) {
    console.error("Error pada endpoint follow-up:", error);
    res.status(500).json({ message: "Gagal memproses pertanyaan lanjutan." });
  }
};

export { getAnalysis, getFollowUp };