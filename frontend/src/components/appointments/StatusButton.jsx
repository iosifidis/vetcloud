import React from 'react';
import { getStatusConfig } from '../../constants/appointments';

/**
 * Clickable status badge that shows the current appointment status.
 *
 * @param {string} status - Current status value
 * @param {function} onClick - Called when button is clicked
 */
const StatusButton = ({ status, onClick }) => {
  const config = getStatusConfig(status);
  return (
    <button
      className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider ${config.buttonClass}`}
      onClick={onClick}
      type="button"
    >
      {config.label}
    </button>
  );
};

export default StatusButton;
