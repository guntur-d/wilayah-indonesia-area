const fastify = require('fastify')({ 
  logger: true 
});
const mongoose = require('mongoose');
require('dotenv').config();

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.register(require('@fastify/static'), {
  root: require('path').join(__dirname, 'public'),
  prefix: '/'
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferCommands: false,
      maxPoolSize: 10
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📁 Connected to database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mongoose Schemas
const WilayahSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa'],
    index: true
  },
  code: {
    type: String,
    required: true,
    index: true
  },
  fullCode: {
    type: String,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  provinsiCode: {
    type: String,
    index: true
  },
  kabupatenKotaCode: String,
  kecamatanCode: String,
  kabupatenKotaFullCode: {
    type: String,
    index: true
  },
  kecamatanFullCode: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Compound indexes for better query performance
WilayahSchema.index({ type: 1, provinsiCode: 1 });
WilayahSchema.index({ type: 1, kabupatenKotaFullCode: 1 });
WilayahSchema.index({ type: 1, kecamatanFullCode: 1 });
WilayahSchema.index({ name: 'text' }); // Text search index

const Wilayah = mongoose.model('Wilayah', WilayahSchema);

// Routes
fastify.get('/api/health', async (request, reply) => {
  return { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas',
    connection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
});

// Wilayah API Routes

// Get all provinces
fastify.get('/api/provinsi', async (request, reply) => {
  try {
    const provinces = await Wilayah.find({ type: 'provinsi' }).sort({ code: 1 }).lean();
    return { data: provinces };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch provinces', details: error.message });
  }
});

// Get kabupaten/kota by province code
fastify.get('/api/provinsi/:provinsiCode/kabupaten-kota', async (request, reply) => {
  try {
    const { provinsiCode } = request.params;
    const kabupatenKota = await Wilayah.find({ 
      type: 'kabupaten_kota', 
      provinsiCode: provinsiCode 
    }).sort({ code: 1 }).lean();
    return { data: kabupatenKota };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch kabupaten/kota', details: error.message });
  }
});

// Get kecamatan by kabupaten/kota full code
fastify.get('/api/kabupaten-kota/:kabkotaCode/kecamatan', async (request, reply) => {
  try {
    const { kabkotaCode } = request.params;
    const kecamatan = await Wilayah.find({ 
      type: 'kecamatan', 
      kabupatenKotaFullCode: kabkotaCode 
    }).sort({ code: 1 }).lean();
    return { data: kecamatan };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch kecamatan', details: error.message });
  }
});

// Get kelurahan/desa by kecamatan full code
fastify.get('/api/kecamatan/:kecamatanCode/kelurahan-desa', async (request, reply) => {
  try {
    const { kecamatanCode } = request.params;
    const kelurahanDesa = await Wilayah.find({ 
      type: 'kelurahan_desa', 
      kecamatanFullCode: kecamatanCode 
    }).sort({ code: 1 }).lean();
    return { data: kelurahanDesa };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch kelurahan/desa', details: error.message });
  }
});

// Search wilayah by name (across all types)
fastify.get('/api/wilayah/search', async (request, reply) => {
  try {
    const { q: searchTerm, type, limit = 100 } = request.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return reply.code(400).send({ error: 'Search term must be at least 2 characters' });
    }

    const query = {
      name: { $regex: searchTerm, $options: 'i' }
    };
    
    if (type) {
      query.type = type;
    }

    const results = await Wilayah.find(query)
      .sort({ type: 1, name: 1 })
      .limit(parseInt(limit))
      .lean();

    return { data: results, total: results.length };
  } catch (error) {
    reply.code(500).send({ error: 'Search failed', details: error.message });
  }
});

// Get complete hierarchy for a specific area
fastify.get('/api/wilayah/hierarchy/:fullCode', async (request, reply) => {
  try {
    const { fullCode } = request.params;
    const hierarchy = {};

    // Determine type based on code length
    let type, query;
    if (fullCode.length === 2) {
      type = 'provinsi';
      query = { type: 'provinsi', code: fullCode };
    } else if (fullCode.length === 4) {
      type = 'kabupaten_kota';
      query = { type: 'kabupaten_kota', fullCode: fullCode };
    } else if (fullCode.length === 7) {
      type = 'kecamatan';
      query = { type: 'kecamatan', fullCode: fullCode };
    } else if (fullCode.length === 10) {
      type = 'kelurahan_desa';
      query = { type: 'kelurahan_desa', fullCode: fullCode };
    } else {
      return reply.code(400).send({ error: 'Invalid area code format' });
    }

    const area = await Wilayah.findOne(query).lean();
    if (!area) {
      return reply.code(404).send({ error: 'Area not found' });
    }

    hierarchy[type] = area;

    // Get parent hierarchy
    if (area.provinsiCode) {
      const provinsi = await Wilayah.findOne({ 
        type: 'provinsi', 
        code: area.provinsiCode 
      }).lean();
      if (provinsi) hierarchy.provinsi = provinsi;
    }

    if (area.kabupatenKotaFullCode && type !== 'kabupaten_kota') {
      const kabupatenKota = await Wilayah.findOne({ 
        type: 'kabupaten_kota', 
        fullCode: area.kabupatenKotaFullCode 
      }).lean();
      if (kabupatenKota) hierarchy.kabupaten_kota = kabupatenKota;
    }

    if (area.kecamatanFullCode && type !== 'kecamatan') {
      const kecamatan = await Wilayah.findOne({ 
        type: 'kecamatan', 
        fullCode: area.kecamatanFullCode 
      }).lean();
      if (kecamatan) hierarchy.kecamatan = kecamatan;
    }

    return { data: hierarchy };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to get hierarchy', details: error.message });
  }
});

// Get wilayah statistics
fastify.get('/api/wilayah/stats', async (request, reply) => {
  try {
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
    
    return { data: result };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to get statistics', details: error.message });
  }
});

// Get wilayah by ID
fastify.get('/api/wilayah/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const wilayah = await Wilayah.findById(id).lean();
    
    if (!wilayah) {
      return reply.code(404).send({ error: 'Wilayah not found' });
    }
    
    return { data: wilayah };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch wilayah', details: error.message });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await connectDB();
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Wilayah Server running on http://${host}:${port}`);
    console.log(`🗺️  Ready to serve Indonesian area data!`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();

// Export for testing
module.exports = { fastify, Wilayah };
