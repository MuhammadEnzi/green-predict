import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="relative text-center flex flex-col items-center justify-center pt-16 md:pt-24">
      {/* Efek gradien di latar belakang */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-brand-green/10 rounded-full blur-3xl -z-10"></div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold text-brand-light mb-4 leading-tight tracking-tight">
        Memprediksi Masa Depan, Melindungi Hari Ini.
      </h1>
      <p className="text-lg md:text-xl text-brand-gray max-w-3xl mx-auto mb-10">
        Platform analisis risiko iklim berbasis AI yang memberikan wawasan strategis dan rekomendasi mitigasi presisi untuk masa depan yang lebih aman.
      </p>
      <Link
        to="/analyze"
        className="text-white bg-brand-green px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-brand-green/30 transform hover:scale-105 hover:shadow-glow transition-all duration-300 flex items-center gap-2"
      >
        <span>Mulai Analisis AI</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </Link>
    </div>
  );
};

export default HomePage;