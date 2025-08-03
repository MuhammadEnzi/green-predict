import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import LoadingSpinner from '../components/LoadingSpinner';
import ChatMessage from '../components/ChatMessage';
import MapSelector from '../components/MapSelector';
import AnalysisHighlights from '../components/AnalysisHighlights';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AnalyzePage = () => {
  const [location, setLocation] = useState(null);
  const [riskType, setRiskType] = useState('Banjir');
  const [conversation, setConversation] = useState([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dangerZone, setDangerZone] = useState(null);
  const [analysisHighlights, setAnalysisHighlights] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('Harap pilih lokasi dari peta terlebih dahulu.');
      return;
    }
    
    const userMessage = `Tolong berikan analisis risiko **${riskType}** untuk lokasi **${location.name}**.`;
    
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    setDangerZone(null);
    setAnalysisHighlights(null);
    setConversation([{ role: 'user', content: userMessage }]);

    try {
      const payload = { lat: location.lat, lon: location.lon, locationName: location.name, riskType: riskType };
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, payload);
      const aiResponse = response.data;
      
      setAnalysisResult(aiResponse);
      setDangerZone(aiResponse.dangerZoneGeoJSON);
      setAnalysisHighlights({
        riskLevel: aiResponse.riskLevel,
        keyFact: aiResponse.keyFact,
        keyRecommendation: aiResponse.keyRecommendation,
      });

      const formattedResponse = `
        <h3 class='font-bold mt-4 mb-2'>🔍 Analisis Risiko Detail</h3>
        <p>${aiResponse.riskAnalysis}</p>
        <h3 class='font-bold mt-4 mb-2'>🏡 Strategi untuk Masyarakat</h3>
        <ul class='list-disc list-inside space-y-1'>
            ${aiResponse.communityMitigation.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <h3 class='font-bold mt-4 mb-2'>🏪 Strategi untuk UMKM</h3>
        <ul class='list-disc list-inside space-y-1'>
            ${aiResponse.msmeStrategy.map(item => `<li>${item}</li>`).join('')}
        </ul>
      `;
      
      setConversation(prev => [...prev, { role: 'assistant', content: formattedResponse }]);

      if (aiResponse.riskLevel?.toLowerCase() === 'tinggi' || aiResponse.riskAnalysis.toLowerCase().includes("parah")) {
          setAnalysisResult(prev => ({ ...prev, isHighRisk: true }));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.';
      setError(errorMessage);
      setConversation(prev => [...prev, { role: 'assistant', content: `Maaf, terjadi kesalahan: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpQuestion.trim()) return;
    const newQuestion = followUpQuestion;
    setIsFollowUpLoading(true);
    setFollowUpQuestion('');
    setConversation(prev => [...prev, { role: 'user', content: newQuestion }]);
    try {
        const payload = { conversationHistory: conversation, newQuestion: newQuestion };
        const response = await axios.post(`${API_BASE_URL}/api/analyze/follow-up`, payload);
        const aiAnswer = response.data.answer;
        setConversation(prev => [...prev, { role: 'assistant', content: aiAnswer }]);
    } catch (err) {
        setConversation(prev => [...prev, { role: 'assistant', content: 'Maaf, saya kesulitan menjawab pertanyaan Anda saat ini.' }]);
    } finally {
        setIsFollowUpLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!analysisResult || !location) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("Laporan Analisis Risiko GreenPredict", pageWidth / 2, y, { align: 'center' });
    y += 15;
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Lokasi Analisis:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${location.name} (${riskType})`, 55, y);
    y += 10;
    doc.line(15, y, pageWidth - 15, y);
    y += 10;
    const addWrappedText = (title, content, isList = false) => {
        doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text(title, 15, y); y += 8;
        doc.setFontSize(11); doc.setFont("helvetica", "normal");
        if (isList) {
            content.forEach(item => {
                const splitItem = doc.splitTextToSize(`• ${item}`, pageWidth - 35);
                doc.text(splitItem, 20, y);
                y += (splitItem.length * 5) + 2;
            });
        } else {
            const splitContent = doc.splitTextToSize(content, pageWidth - 30);
            doc.text(splitContent, 15, y);
            y += (splitContent.length * 5) + 10;
        }
    }
    addWrappedText("🔍 Intisari Analisis", `Tingkat Risiko: ${analysisResult.riskLevel}\nFakta Kunci: ${analysisResult.keyFact}\nRekomendasi Utama: ${analysisResult.keyRecommendation}`);
    addWrappedText("📝 Analisis Risiko Detail", analysisResult.riskAnalysis);
    addWrappedText("🏡 Strategi untuk Masyarakat", analysisResult.communityMitigation, true);
    addWrappedText("🏪 Strategi untuk UMKM", analysisResult.msmeStrategy, true);
    doc.save(`Laporan-GreenPredict-${location.name}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {conversation.length === 0 ? (
        <div className="bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-light mb-4 text-center">Mulai Analisis Risiko</h2>
            <div className="mb-6 text-center text-sm text-brand-gray bg-brand-dark-secondary/20 p-4 rounded-lg">
              <p>Fitur ini menggunakan AI dan data iklim real-time untuk menganalisis risiko bencana lokal. Pilih lokasi di peta, tentukan jenis risiko, dan dapatkan rekomendasi strategis beserta intisari analisisnya.</p>
            </div>
            <MapSelector onLocationSelect={(loc) => setLocation(loc)} />
            <form onSubmit={handleInitialSubmit} className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <div className="w-full sm:w-auto flex-grow">
                    <select id="riskType" value={riskType} onChange={(e) => setRiskType(e.target.value)} className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent transition bg-brand-dark-secondary text-brand-light">
                        <option>Banjir</option> <option>Kekeringan</option> <option>Cuaca Ekstrem</option>
                    </select>
                </div>
                <button type="submit" disabled={isLoading || !location} className="w-full sm:w-auto bg-brand-green text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-glow">
                    {isLoading ? <LoadingSpinner /> : <span>Analisis Awal</span>}
                </button>
            </form>
            {error && !isLoading && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div className="bg-brand-dark-secondary/50 border border-white/10 rounded-2xl shadow-lg min-h-[70vh] flex flex-col backdrop-blur-sm overflow-hidden">
            {analysisHighlights && <AnalysisHighlights highlights={analysisHighlights} />}
            <div className="flex-grow space-y-6 overflow-y-auto p-4 md:p-6">
                {conversation.map((msg, index) => (
                    <ChatMessage key={index} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <ChatMessage role="assistant" content="<div class='flex items-center gap-2'><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse'></div><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150'></div><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300'></div></div>" />}
                {isFollowUpLoading && (
                    <ChatMessage role="assistant" content="<div class='flex items-center gap-2'><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse'></div><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150'></div><div class='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300'></div></div>" />
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="mt-auto p-4 md:p-6 border-t border-white/10 bg-brand-dark-secondary/50">
                <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2">
                    <input type="text" value={followUpQuestion} onChange={(e) => setFollowUpQuestion(e.target.value)} placeholder="Tanyakan skenario lain..." className="flex-grow px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent transition bg-brand-dark text-brand-light" />
                    <button type="submit" disabled={isFollowUpLoading} className="bg-brand-green text-white p-2.5 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-500">
                        {isFollowUpLoading ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                    </button>
                </form>
                {analysisResult && (
                    <div className="text-center mt-4">
                        <button onClick={handleDownloadPdf} className="text-sm text-brand-green font-semibold hover:underline">
                            Unduh Laporan Analisis (PDF)
                        </button>
                    </div>
                )}
                {analysisResult?.isHighRisk && (
                    <div className="text-center mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                        <p className="text-red-300 mb-2">Peringatan: Risiko tinggi terdeteksi!</p>
                        <button 
                            onClick={() => navigate('/evacuation', { state: { userLocation: location, dangerZone: dangerZone } })}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Tampilkan Rute Evakuasi Cerdas
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzePage;