const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

class WilayahMongoUploader {
  constructor() {
    this.dataPath = path.join(__dirname, 'db', 'data_wilayah');
    this.stats = {
      provinsi: 0,
      kabupaten_kota: 0,
      kecamatan: 0,
      kelurahan_desa: 0,
      errors: []
    };
    this.batchSize = 1000; // Process in batches for better performance
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      console.log('🔌 Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        bufferCommands: false,
        maxPoolSize: 10
      });

      console.log('✅ Connected to MongoDB successfully');
      console.log(`📁 Using database: ${mongoose.connection.name}`);
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      return false;
    }
  }

  // Define the schema (same as in server)
  setupModel() {
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

    return mongoose.model('Wilayah', WilayahSchema);
  }

  async clearExistingData(Wilayah) {
    console.log('🗑️ Clearing existing wilayah data...');
    try {
      const result = await Wilayah.deleteMany({});
      console.log(`✅ Cleared ${result.deletedCount} existing records`);
    } catch (error) {
      console.log(`⚠️ Error clearing data: ${error.message}`);
    }
  }

  async uploadProvinsi(Wilayah) {
    console.log('\n📍 Uploading Provinsi data...');
    try {
      const filePath = path.join(this.dataPath, 'provinsi', 'provinsi.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const documents = [];
      for (const [code, name] of Object.entries(data)) {
        documents.push({
          type: 'provinsi',
          code: code,
          name: name,
          fullCode: code
        });
      }
      
      await Wilayah.insertMany(documents);
      this.stats.provinsi = documents.length;
      
      console.log(`✅ Uploaded ${this.stats.provinsi} provinsi records`);
    } catch (error) {
      console.error('❌ Error uploading provinsi:', error);
      this.stats.errors.push(`Provinsi: ${error.message}`);
    }
  }

  async uploadKabupatenKota(Wilayah) {
    console.log('\n🏙️ Uploading Kabupaten/Kota data...');
    try {
      const kabupatenPath = path.join(this.dataPath, 'kabupaten_kota');
      const files = fs.readdirSync(kabupatenPath).filter(file => file.endsWith('.json'));
      
      const allDocuments = [];
      
      for (const file of files) {
        const provinsiCode = file.match(/kab-(\d+)\.json/)?.[1];
        if (!provinsiCode) continue;
        
        const filePath = path.join(kabupatenPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${code}`;
          allDocuments.push({
            type: 'kabupaten_kota',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode
          });
        }
      }
      
      // Insert in batches
      for (let i = 0; i < allDocuments.length; i += this.batchSize) {
        const batch = allDocuments.slice(i, i + this.batchSize);
        await Wilayah.insertMany(batch);
        console.log(`📊 Inserted batch ${Math.floor(i / this.batchSize) + 1}, records: ${i + batch.length}/${allDocuments.length}`);
      }
      
      this.stats.kabupaten_kota = allDocuments.length;
      console.log(`✅ Uploaded ${this.stats.kabupaten_kota} kabupaten/kota records`);
    } catch (error) {
      console.error('❌ Error uploading kabupaten/kota:', error);
      this.stats.errors.push(`Kabupaten/Kota: ${error.message}`);
    }
  }

  async uploadKecamatan(Wilayah) {
    console.log('\n🏘️ Uploading Kecamatan data...');
    try {
      const kecamatanPath = path.join(this.dataPath, 'kecamatan');
      const files = fs.readdirSync(kecamatanPath).filter(file => file.endsWith('.json'));
      
      const allDocuments = [];
      let processedFiles = 0;
      
      for (const file of files) {
        const match = file.match(/kec-(\d+)-(\d+)\.json/);
        if (!match) continue;
        
        const [, provinsiCode, kabupatenCode] = match;
        const filePath = path.join(kecamatanPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${kabupatenCode}${code}`;
          allDocuments.push({
            type: 'kecamatan',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode,
            kabupatenKotaCode: kabupatenCode,
            kabupatenKotaFullCode: `${provinsiCode}${kabupatenCode}`
          });
        }
        
        processedFiles++;
        if (processedFiles % 50 === 0) {
          console.log(`📊 Processing progress: ${processedFiles}/${files.length} files`);
        }
      }
      
      // Insert in batches
      for (let i = 0; i < allDocuments.length; i += this.batchSize) {
        const batch = allDocuments.slice(i, i + this.batchSize);
        await Wilayah.insertMany(batch);
        console.log(`📊 Inserted batch ${Math.floor(i / this.batchSize) + 1}, records: ${i + batch.length}/${allDocuments.length}`);
      }
      
      this.stats.kecamatan = allDocuments.length;
      console.log(`✅ Uploaded ${this.stats.kecamatan} kecamatan records`);
    } catch (error) {
      console.error('❌ Error uploading kecamatan:', error);
      this.stats.errors.push(`Kecamatan: ${error.message}`);
    }
  }

  async uploadKelurahanDesa(Wilayah) {
    console.log('\n🏡 Uploading Kelurahan/Desa data...');
    try {
      const kelurahanPath = path.join(this.dataPath, 'kelurahan_desa');
      const files = fs.readdirSync(kelurahanPath).filter(file => file.endsWith('.json'));
      
      const total = files.length;
      let processedFiles = 0;
      let allDocuments = [];
      
      console.log(`📊 Total files to process: ${total}`);
      
      for (const file of files) {
        const match = file.match(/keldesa-(\d+)-(\d+)-(\d+)\.json/);
        if (!match) continue;
        
        const [, provinsiCode, kabupatenCode, kecamatanCode] = match;
        const filePath = path.join(kelurahanPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${kabupatenCode}${kecamatanCode}${code}`;
          allDocuments.push({
            type: 'kelurahan_desa',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode,
            kabupatenKotaCode: kabupatenCode,
            kecamatanCode: kecamatanCode,
            kabupatenKotaFullCode: `${provinsiCode}${kabupatenCode}`,
            kecamatanFullCode: `${provinsiCode}${kabupatenCode}${kecamatanCode}`
          });
        }
        
        processedFiles++;
        
        // Process in smaller batches to avoid memory issues
        if (allDocuments.length >= this.batchSize) {
          await Wilayah.insertMany(allDocuments);
          this.stats.kelurahan_desa += allDocuments.length;
          console.log(`📊 Progress: ${processedFiles}/${total} files, ${this.stats.kelurahan_desa} records inserted`);
          allDocuments = []; // Reset array
        }
        
        if (processedFiles % 500 === 0) {
          console.log(`📊 Files processed: ${processedFiles}/${total}`);
        }
      }
      
      // Insert remaining documents
      if (allDocuments.length > 0) {
        await Wilayah.insertMany(allDocuments);
        this.stats.kelurahan_desa += allDocuments.length;
      }
      
      console.log(`✅ Uploaded ${this.stats.kelurahan_desa} kelurahan/desa records`);
    } catch (error) {
      console.error('❌ Error uploading kelurahan/desa:', error);
      this.stats.errors.push(`Kelurahan/Desa: ${error.message}`);
    }
  }

  async uploadAll() {
    console.log('🚀 Starting Indonesian Area Data Upload to MongoDB Atlas');
    console.log('=' * 60);
    
    const startTime = Date.now();
    
    // Setup model
    const Wilayah = this.setupModel();
    
    // Clear existing data
    await this.clearExistingData(Wilayah);
    
    // Upload data in hierarchy order
    await this.uploadProvinsi(Wilayah);
    await this.uploadKabupatenKota(Wilayah);
    await this.uploadKecamatan(Wilayah);
    await this.uploadKelurahanDesa(Wilayah);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Upload Summary:');
    console.log('=' * 40);
    console.log(`📍 Provinsi: ${this.stats.provinsi.toLocaleString()} records`);
    console.log(`🏙️ Kabupaten/Kota: ${this.stats.kabupaten_kota.toLocaleString()} records`);
    console.log(`🏘️ Kecamatan: ${this.stats.kecamatan.toLocaleString()} records`);
    console.log(`🏡 Kelurahan/Desa: ${this.stats.kelurahan_desa.toLocaleString()} records`);
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`📈 Total records: ${(this.stats.provinsi + this.stats.kabupaten_kota + this.stats.kecamatan + this.stats.kelurahan_desa).toLocaleString()}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  • ${error}`));
    } else {
      console.log('\n🎉 All data uploaded successfully!');
    }
    
    console.log('\n🔍 Creating indexes...');
    try {
      await Wilayah.createIndexes();
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.log(`⚠️ Index creation warning: ${error.message}`);
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Main execution
async function main() {
  const uploader = new WilayahMongoUploader();
  
  try {
    const connected = await uploader.connect();
    if (!connected) {
      process.exit(1);
    }
    
    await uploader.uploadAll();
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await uploader.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the upload
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WilayahMongoUploader;
