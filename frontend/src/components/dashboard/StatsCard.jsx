import React from 'react';

/**
 * Stats card showing a single metric with icon, value, and label.
 *
 * @param {string} icon - Emoji or icon character
 * @param {string} label - Metric label
 * @param {number|string} value - Metric value
 * @param {string} colorClass - Tailwind bg color class for the icon container
 */
const StatsCard = ({ icon, label, value, colorClass = 'bg-blue-100 text-blue-600' }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
