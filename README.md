

# GreenPredict: Asisten Mitigasi Iklim Berbasis AI






--------------------------------- Deskripsi ---------------------------

Memprediksi Masa Depan, Melindungi Hari Ini.

GreenPredict adalah platform analisis risiko iklim canggih yang dirancang sebagai capstone project. Aplikasi ini menjembatani kesenjangan antara data iklim yang kompleks dengan aksi mitigasi yang nyata di tingkat komunitas. Visi kami adalah memberdayakan setiap individu, UMKM, dan pengurus komunitas dengan wawasan berbasis data dan AI untuk membangun ketahanan terhadap bencana iklim seperti banjir, kekeringan, dan cuaca ekstrem. Proyek ini bukan hanya tentang memprediksi risiko, tetapi tentang menginspirasi aksi, memfasilitasi persiapan, dan menyediakan panduan saat krisis terjadi.

------------------------------- Fitur Unggulan -------------------------------

Proyek ini dirancang sebagai sistem manajemen bencana yang komprehensif, menggabungkan beberapa fitur inovatif:

Analisis Risiko Cerdas: Pengguna memilih lokasi di peta interaktif untuk mendapatkan analisis mendalam tentang risiko iklim menggunakan data cuaca real-time.

Intisari Analisis Visual: Hasil analisis yang kompleks secara otomatis diringkas oleh AI menjadi tiga poin kunci—Tingkat Risiko, Fakta Kunci, dan Rekomendasi Utama—yang disajikan dalam panel visual modern.

Percakapan Lanjutan ("Bagaimana Jika?"): Memfasilitasi dialog dinamis dengan AI, memungkinkan pengguna menanyakan skenario lanjutan yang lebih personal untuk mendapatkan rekomendasi yang lebih spesifik.

Lensa Waktu Iklim: Sebuah dasbor visualisasi data interaktif yang menampilkan tren perubahan suhu dari data historis (tahun 2000) hingga proyeksi masa depan (tahun 2050).

Perencana Rute Evakuasi Cerdas: Fitur paling inovatif di mana AI tidak hanya menganalisis risiko, tetapi juga menghasilkan poligon zona bahaya (GeoJSON). Sistem kemudian secara otomatis menghitung dan menampilkan rute evakuasi teraman yang menghindari zona bahaya tersebut.

Unduh Laporan PDF: Pengguna dapat mengunduh hasil analisis lengkap dalam format PDF yang rapi, memudahkan untuk berbagi dan perencanaan aksi.

----------------------------------------- Teknologi yang Digunakan -------------------------------

Berikut adalah rincian tumpukan teknologi (tech stack) yang digunakan dalam proyek ini:

Frontend:

Framework: React (dengan Vite)

Styling: Tailwind CSS

Visualisasi: React Leaflet (Peta), Recharts (Grafik)

Utilitas: Axios (Komunikasi API), jsPDF (Pembuatan Laporan)

Backend:

Framework: Node.js & Express.js

Layanan Eksternal & API:

Model AI: IBM Granite (diakses melalui Replicate API)

Data Iklim: Open-Meteo API

Perutean: OpenRouteService API

Data Geospasial: Overpass API & Nominatim API (dari OpenStreetMap)

---------------------------------- Penjelasan Dukungan AI ----------------------------------

Kecerdasan buatan (AI) adalah inti dari GreenPredict, digunakan tidak hanya sebagai penjawab, tetapi sebagai mesin analisis dan sintesis yang canggih. Kami menggunakan model IBM Granite yang diakses melalui Replicate API.

Peran AI dalam proyek ini mencakup:

Analisis Kontekstual: AI menerima data mentah (seperti data curah hujan dan koordinat) dan mengubahnya menjadi analisis risiko kualitatif yang mudah dipahami.

Peringkasan Cerdas: AI secara otomatis mengidentifikasi dan meringkas informasi paling krusial dari analisisnya sendiri menjadi "Tingkat Risiko", "Fakta Kunci", dan "Rekomendasi Utama".

Generasi Data Geospasial: Dalam fitur evakuasi, AI diminta untuk "berpikir" seperti analis GIS dan menghasilkan poligon GeoJSON yang merepresentasikan zona bahaya. Data ini kemudian digunakan secara langsung oleh sistem perutean.

Pemahaman Konteks Percakapan: Untuk fitur "Bagaimana Jika?", AI mampu memahami riwayat percakapan sebelumnya untuk memberikan jawaban lanjutan yang relevan dan personal.

Pendekatan ini menunjukkan arsitektur Retrieval-Augmented Generation (RAG) sederhana, di mana kami memperkaya prompt dengan data real-time untuk mendapatkan hasil yang jauh lebih akurat dan relevan daripada sekadar bertanya langsung ke model.

------------------------------- Panduan Instalasi & Menjalankan Proyek ------------------------------

Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah di bawah ini.

Prasyarat
Node.js (v18 atau lebih tinggi)

NPM atau Yarn

Akun Replicate untuk mendapatkan API Token.

Akun OpenRouteService untuk mendapatkan API Key.

1. Setup Backend (Server)
Buka terminal pertama Anda:

# Masuk ke direktori server
cd server

# Instal semua dependensi
npm install

# Buat file .env dan isi dengan kredensial Anda
# (Salin dari .env.example jika ada, atau buat baru)

# Jalankan server backend
npm run dev

Server akan berjalan di http://localhost:5001.

2. Setup Frontend (Client)
Buka terminal kedua:

# Masuk ke direktori client
cd client

# Instal semua dependensi
npm install

# Jalankan aplikasi React
npm run dev

Aplikasi akan otomatis terbuka di browser Anda, biasanya di http://localhost:5173.

Variabel Lingkungan (.env) - > ini komponen penting untuk integrasi api

Pastikan Anda membuat file .env di dalam folder server dengan format berikut:

PORT=5001

REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

ORS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

