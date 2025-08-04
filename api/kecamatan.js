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

    const { kabkotaCode } = req.query;

    if (!kabkotaCode) {
      return res.status(400).json({
        success: false,
        error: 'Kabupaten/Kota code is required'
      });
    }

    const kecamatan = await Wilayah.find({
      type: 'kecamatan',
      kabupatenKotaFullCode: kabkotaCode
    })
      .sort({ code: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: kecamatan
    });

  } catch (error) {
    console.error('Kecamatan API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch kecamatan',
      message: error.message
    });
  }
}
