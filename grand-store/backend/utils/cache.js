const cache = {};

const getCache = (key) => {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete cache[key];
    return null;
  }
  return item.data;
};

const setCache = (key, data, ttlSeconds = 60) => {
  cache[key] = {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  };
};

const clearCache = (keyPrefix) => {
  if (!keyPrefix) {
    for (const key in cache) delete cache[key];
    return;
  }
  for (const key in cache) {
    if (key.startsWith(keyPrefix)) {
      delete cache[key];
    }
  }
};

module.exports = { getCache, setCache, clearCache };
