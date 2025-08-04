const { connectToDatabase, Wilayah } = require('../lib/mongodb.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const {
      type,
      provinsi_code,
      kabupaten_kota_code,
      kecamatan_code,
      search,
      limit = 100,
      skip = 0,
      sort = 'name'
    } = req.query;

    // Build query based on parameters
    let query = {};
    
    if (type) {
      query.type = type;
    }

    if (provinsi_code) {
      query.provinsiCode = provinsi_code;
    }

    if (kabupaten_kota_code) {
      query.kabupatenKotaFullCode = kabupaten_kota_code;
    }

    if (kecamatan_code) {
      query.kecamatanFullCode = kecamatan_code;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Build sort object
    let sortObj = {};
    if (sort === 'name') {
      sortObj.name = 1;
    } else if (sort === 'code') {
      sortObj.code = 1;
    } else if (sort === 'type') {
      sortObj.type = 1;
      sortObj.name = 1;
    }

    const total = await Wilayah.countDocuments(query);
    const data = await Wilayah.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
