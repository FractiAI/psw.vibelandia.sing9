/**
 * Vercel / Node serverless: req.body may be undefined, a Buffer, or a JSON string.
 * Fall back to reading the request stream when needed.
 */
module.exports = async function parseJsonBody(req) {
  if (req.body != null) {
    if (typeof req.body === 'string') {
      try {
        return req.body.trim() ? JSON.parse(req.body) : {};
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        const s = req.body.toString('utf8');
        return s.trim() ? JSON.parse(s) : {};
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
  }
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return {};
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw.trim() ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
};
