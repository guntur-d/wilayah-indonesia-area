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

    const { provinsiCode } = req.query;

    if (!provinsiCode) {
      return res.status(400).json({
        success: false,
        error: 'Province code is required'
      });
    }

    const kabupatenKota = await Wilayah.find({
      type: 'kabupaten_kota',
      provinsiCode: provinsiCode
    })
      .sort({ code: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: kabupatenKota
    });

  } catch (error) {
    console.error('Kabupaten/Kota API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch kabupaten/kota',
      message: error.message
    });
  }
}
