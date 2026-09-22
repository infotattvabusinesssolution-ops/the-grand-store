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

export const subscribeCigarNewsletter = async (email) => {
  const response = await fetch(`${apiOrigin}/api/newsletter/subscribe`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, source: 'cigar-store' }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Your subscription could not be processed.');
  return data;
};
