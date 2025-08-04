const { connectToDatabase } = require('../lib/mongodb.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const conn = await connectToDatabase();
    const isConnected = conn.connection.readyState === 1;

    return res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'MongoDB Atlas',
      connection: isConnected ? 'Connected' : 'Disconnected',
      api_version: '1.0.0',
      endpoints: {
        provinces: '/api/provinsi',
        regencies: '/api/kabupaten-kota?provinsiCode={code}',
        districts: '/api/kecamatan?kabkotaCode={code}',
        villages: '/api/kelurahan-desa?kecamatanCode={code}',
        search: '/api/wilayah?search={term}&type={type}',
        stats: '/api/stats'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'MongoDB Atlas',
      connection: 'Failed',
      error: error.message
    });
  }
}
