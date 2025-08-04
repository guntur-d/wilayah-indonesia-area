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

    const stats = await Wilayah.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = {};
    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    // Add total count
    const total = Object.values(result).reduce((sum, count) => sum + count, 0);
    result.total = total;

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
}
