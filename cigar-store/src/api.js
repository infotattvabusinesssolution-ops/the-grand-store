const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const fallbackOrigin = isLocalhost ? 'http://localhost:5015' : 'https://store-api.yogapranafitness.com';
const apiOrigin = (import.meta.env.VITE_API_URL || fallbackOrigin).replace(/\/$/, '');

export const submitCigarEnquiry = async (payload) => {
  const response = await fetch(`${apiOrigin}/api/cigar-enquiries/public`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Your enquiry could not be submitted.');
  return data;
};
