/**
 * GET /api/health
 * 健康检查端点
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};
