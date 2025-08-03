import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';
import TimeLensPage from './pages/TimeLensPage';
import EvacuationPage from './pages/EvacuationPage'; // <-- 1. Impor halaman baru

function App() {
  return (
    <div className="bg-brand-dark min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/timelens" element={<TimeLensPage />} />
          <Route path="/evacuation" element={<EvacuationPage />} /> {/* <-- 2. Daftarkan halaman baru */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
