const mongoose = require('mongoose');

// Mongoose connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Wilayah Schema
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

const Wilayah = mongoose.models.Wilayah || mongoose.model('Wilayah', WilayahSchema);

module.exports = { connectToDatabase, Wilayah };
