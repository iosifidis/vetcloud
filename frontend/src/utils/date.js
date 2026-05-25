/**
 * Convert a Date to local ISO string (YYYY-MM-DDTHH:mm:ss)
 * preserving the local timezone.
 */
export const toLocalISOString = (date) => {
  if (!date) return null;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 19);
};

/**
 * Format a date string to a human-readable format.
 * @param {string} dateString - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  const defaults = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(dateString).toLocaleDateString('en-US', { ...defaults, ...options });
};

/**
 * Format a date string to include time.
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate age from a birth date.
 * Returns a human-readable string like "2 years", "5 months", "10 days".
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
};
