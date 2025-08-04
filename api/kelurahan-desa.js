const { connectToDatabase, Wilayah } = require('../lib/mongodb.js');

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
    await connectToDatabase();

    const { kecamatanCode } = req.query;

    if (!kecamatanCode) {
      return res.status(400).json({
        success: false,
        error: 'Kecamatan code is required'
      });
    }

    const kelurahanDesa = await Wilayah.find({
      type: 'kelurahan_desa',
      kecamatanFullCode: kecamatanCode
    })
      .sort({ code: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: kelurahanDesa
    });

  } catch (error) {
    console.error('Kelurahan/Desa API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch kelurahan/desa',
      message: error.message
    });
  }
}
