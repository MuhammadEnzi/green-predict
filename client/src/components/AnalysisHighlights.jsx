import React from 'react';

const HighlightItem = ({ title, value, colorClass, icon }) => (
  <div className="flex-1 px-4 py-2 min-w-0">
    <div className="flex items-center gap-3">
      <div className={`text-2xl ${colorClass} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm text-brand-gray">{title}</h3>
        <p className={`font-bold text-base ${colorClass}`}>{value}</p>
      </div>
    </div>
  </div>
);

const AnalysisHighlights = ({ highlights }) => {
  const getRiskColor = (level) => {
    if (level?.toLowerCase() === 'tinggi') return 'text-red-400';
    if (level?.toLowerCase() === 'sedang') return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-brand-dark border-b border-white/10 rounded-t-2xl p-2 md:p-3 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
      <HighlightItem
        icon="⚠️"
        title="Tingkat Risiko"
        value={highlights.riskLevel || 'N/A'}
        colorClass={getRiskColor(highlights.riskLevel)}
      />
      <HighlightItem
        icon="💡"
        title="Fakta Kunci"
        value={highlights.keyFact || 'N/A'}
        colorClass="text-blue-400"
      />
      <HighlightItem
        icon="🚀"
        title="Rekomendasi Utama"
        value={highlights.keyRecommendation || 'N/A'}
        colorClass="text-brand-green"
      />
    </div>
  );
};

export default AnalysisHighlights;
