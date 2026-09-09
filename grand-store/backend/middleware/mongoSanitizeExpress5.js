/**
 * Express 5.x compatible NoSQL injection sanitizer.
 * Recursively strips keys starting with '$' or containing '.' from req.body and req.params.
 * Avoids crashing on Express 5's read-only req.query getter.
 */
function cleanObject(target) {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (typeof target[i] === 'object' && target[i] !== null) {
        cleanObject(target[i]);
      }
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      cleanObject(target[key]);
    }
  }

  return target;
}

function mongoSanitizeExpress5(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    cleanObject(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    cleanObject(req.params);
  }
  next();
}

module.exports = mongoSanitizeExpress5;
