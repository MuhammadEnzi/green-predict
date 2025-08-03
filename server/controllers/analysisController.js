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

    const promptForAI = `
      Anda adalah "GreenPredict", seorang ahli mitigasi bencana. Tugas Anda adalah memberikan analisis risiko iklim yang detail DAN meringkasnya menjadi poin-poin kunci berdasarkan data input. Jawab dalam Bahasa Indonesia.

      ### DATA INPUT ###
      **Lokasi:** ${locationName}
      **Jenis Risiko untuk Dianalisis:** "${riskType}"
      **Data Curah Hujan (90 hari terakhir):** Rata-rata ${averagePrecipitation} mm/hari.

      ### TUGAS ANDA ###
      1.  **Tentukan Tingkat Risiko**: Berdasarkan data curah hujan dan konteks risiko, berikan satu kata kesimpulan: "Rendah", "Sedang", atau "Tinggi".
      2.  **Identifikasi Fakta Kunci**: Pilih satu data paling penting yang mendukung kesimpulan Anda.
      3.  **Pilih Rekomendasi Utama**: Pilih satu aksi mitigasi yang paling berdampak.
      4.  Buat analisis risiko, strategi komunitas, dan strategi UMKM yang detail.
      5.  Buat poligon GeoJSON sederhana untuk zona bahaya.

      ### CONTOH-CONTOH OUTPUT (Gunakan sebagai referensi utama) ###

      #### Contoh untuk Risiko Banjir ####
      {
        "riskLevel": "Rendah",
        "keyFact": "Curah hujan rata-rata sangat rendah (misal: 1.2 mm/hari), tidak cukup untuk menyebabkan genangan signifikan.",
        "keyRecommendation": "Fokus pada pemeliharaan rutin saluran air yang sudah ada.",
        "riskAnalysis": "Dengan curah hujan rata-rata yang sangat rendah, risiko banjir genangan di lokasi ini tergolong rendah. Sistem drainase yang ada kemungkinan besar mampu menangani volume air saat ini.",
        "communityMitigation": ["Pastikan selokan tidak tersumbat sampah daun.", "Lakukan pemetaan area cekungan kecil sebagai antisipasi."],
        "msmeStrategy": ["Fokus pada efisiensi operasional, risiko banjir bukan ancaman utama saat ini."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[0,0]]]}
      }
      {
        "riskLevel": "Sedang",
        "keyFact": "Curah hujan moderat (misal: 4.5 mm/hari) dapat menyebabkan genangan di area-area tertentu.",
        "keyRecommendation": "Buat lubang resapan biopori untuk meningkatkan penyerapan air tanah.",
        "riskAnalysis": "Curah hujan pada level moderat menunjukkan adanya potensi genangan lokal, terutama di area dengan drainase kurang baik atau di dekat aliran sungai kecil.",
        "communityMitigation": ["Buat lubang resapan biopori di setiap RT.", "Adakan kerja bakti pembersihan selokan sebulan sekali."],
        "msmeStrategy": ["Amankan barang dagangan di rak yang lebih tinggi dari lantai.", "Miliki daftar kontak darurat untuk evakuasi barang."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[106.80, -6.25], [106.81, -6.26], [106.80, -6.27], [106.80, -6.25]]] }
      }
      {
        "riskLevel": "Tinggi",
        "keyFact": "Curah hujan sangat tinggi (misal: 8.7 mm/hari) berpotensi besar menyebabkan banjir luas.",
        "keyRecommendation": "Prioritaskan normalisasi dan pembersihan rutin saluran drainase primer.",
        "riskAnalysis": "Dengan curah hujan rata-rata yang sangat tinggi, lokasi ini memiliki risiko signifikan terhadap banjir genangan luas. Sistem drainase kemungkinan akan terbebani, terutama saat puncak musim hujan.",
        "communityMitigation": ["Lakukan normalisasi sungai.", "Bentuk tim siaga bencana tingkat RW.", "Siapkan jalur evakuasi."],
        "msmeStrategy": ["Pertimbangkan asuransi properti untuk bencana banjir.", "Buat rencana kontingensi operasional jarak jauh."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[106.82, -6.20], [106.83, -6.21], [106.82, -6.22], [106.81, -6.21], [106.82, -6.20]]] }
      }

      #### Contoh untuk Risiko Kekeringan ####
      {
        "riskLevel": "Rendah",
        "keyFact": "Curah hujan yang cukup tinggi (misal: 6.1 mm/hari) memastikan pasokan air yang melimpah.",
        "keyRecommendation": "Fokus pada efisiensi penggunaan air untuk keberlanjutan.",
        "riskAnalysis": "Dengan curah hujan yang konsisten dan tinggi, risiko kekeringan di lokasi ini sangat rendah. Sumber daya air permukaan dan air tanah kemungkinan besar dalam kondisi surplus.",
        "communityMitigation": ["Promosikan penggunaan kembali air bekas (greywater) untuk menyiram tanaman."],
        "msmeStrategy": ["Manfaatkan ketersediaan air untuk produk agrikultur bernilai tinggi."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[0,0]]]}
      }
      {
        "riskLevel": "Sedang",
        "keyFact": "Curah hujan yang minim (misal: 1.8 mm/hari) menekan ketersediaan sumber daya air.",
        "keyRecommendation": "Membangun embung atau waduk kecil untuk menampung air hujan.",
        "riskAnalysis": "Curah hujan yang berada di bawah rata-rata normal menunjukkan adanya tekanan pada sumber daya air. Risiko kekeringan tingkat sedang dapat terjadi, terutama pada sektor pertanian.",
        "communityMitigation": ["Membangun embung komunal.", "Mengadakan kampanye hemat air di tingkat rumah tangga."],
        "msmeStrategy": ["UMKM agrikultur disarankan menanam varietas yang lebih hemat air.", "Usaha cuci mobil dapat menerapkan sistem daur ulang air."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[107.60, -6.90], [107.61, -6.91], [107.60, -6.92], [107.59, -6.91], [107.60, -6.90]]] }
      }
      {
        "riskLevel": "Tinggi",
        "keyFact": "Curah hujan yang sangat rendah (misal: 0.5 mm/hari) mengindikasikan krisis air yang parah.",
        "keyRecommendation": "Terapkan teknik irigasi tetes (drip irrigation) untuk pertanian.",
        "riskAnalysis": "Dengan curah hujan yang sangat minim, lokasi ini berisiko tinggi mengalami kekeringan parah yang dapat menyebabkan gagal panen dan krisis air bersih yang meluas.",
        "communityMitigation": ["Melakukan reboisasi di area hulu.", "Membuat sumur bor dalam sebagai sumber air darurat."],
        "msmeStrategy": ["Diversifikasi usaha ke sektor yang tidak bergantung pada air.", "Cari pemasok dari wilayah lain."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[107.50, -7.00], [107.51, -7.01], [107.50, -7.02], [107.49, -7.01], [107.50, -7.00]]] }
      }

      #### Contoh untuk Risiko Cuaca Ekstrem ####
      {
        "riskLevel": "Rendah",
        "keyFact": "Data historis menunjukkan pola cuaca yang stabil dengan sedikit anomali.",
        "keyRecommendation": "Lakukan pemeriksaan rutin pada struktur bangunan seperti atap.",
        "riskAnalysis": "Risiko cuaca ekstrem seperti angin kencang atau badai petir di lokasi ini tergolong rendah. Pola cuaca cenderung stabil dan tidak menunjukkan anomali yang signifikan.",
        "communityMitigation": ["Pastikan pohon-pohon di sekitar rumah dipangkas secara rutin untuk menghindari cabang tumbang."],
        "msmeStrategy": ["Miliki genset atau sumber listrik cadangan untuk mengantisipasi pemadaman singkat."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[0,0]]]}
      }
      {
        "riskLevel": "Sedang",
        "keyFact": "Lokasi ini terkadang mengalami angin kencang selama pergantian musim.",
        "keyRecommendation": "Amankan benda-benda di luar ruangan yang mudah terbang.",
        "riskAnalysis": "Ada risiko sedang terjadinya cuaca ekstrem, terutama angin kencang saat masa pancaroba. Ini dapat menyebabkan kerusakan ringan pada atap atau papan reklame.",
        "communityMitigation": ["Bentuk grup komunikasi warga (misal: WhatsApp) untuk berbagi peringatan cuaca.", "Amankan antena atau parabola di atap."],
        "msmeStrategy": ["UMKM dengan area outdoor (kafe, restoran) harus memiliki rencana untuk mengamankan perabotan dengan cepat."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[106.90, -6.30], [106.91, -6.31], [106.90, -6.32], [106.89, -6.31], [106.90, -6.30]]] }
      }
      {
        "riskLevel": "Tinggi",
        "keyFact": "Lokasi ini berada di jalur yang sering dilewati badai petir dan angin puting beliung.",
        "keyRecommendation": "Buat rencana evakuasi keluarga dan siapkan tas siaga bencana.",
        "riskAnalysis": "Risiko cuaca ekstrem di lokasi ini sangat tinggi. Data menunjukkan frekuensi badai petir yang signifikan dan potensi angin puting beliung yang dapat menyebabkan kerusakan properti yang parah dan mengancam keselamatan.",
        "communityMitigation": ["Bangun atau tentukan tempat perlindungan komunal yang kokoh.", "Pasang sistem penangkal petir di fasilitas umum.", "Lakukan latihan evakuasi secara berkala."],
        "msmeStrategy": ["Lindungi aset usaha dengan asuransi yang mencakup kerusakan akibat badai.", "Perkuat struktur bangunan usaha, terutama bagian atap dan jendela."],
        "dangerZoneGeoJSON": { "type": "Polygon", "coordinates": [[[106.70, -6.40], [106.71, -6.41], [106.70, -6.42], [106.69, -6.41], [106.70, -6.40]]] }
      }

      ### OUTPUT ANDA (HANYA JSON) ###
      Hasilkan respons HANYA dalam format JSON yang valid berdasarkan DATA INPUT di atas. Jangan sertakan teks pembuka, penutup, atau penjelasan apapun di luar objek JSON.
    `;

    console.log("Mengirim permintaan analisis dengan prompt 9 contoh...");
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