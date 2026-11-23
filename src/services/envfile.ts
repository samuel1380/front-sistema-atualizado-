export const env = {
  BASE_URL: typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3002'
    : 'https://api.labodontoprint.com.br',
};

export const envFront = {
  BASE_URL: typeof window !== 'undefined'
    ? window.location.origin
    : 'https://labodontoprint.com.br',
};
