const fs = require('fs');
const path = require('path');

class WilayahJSONExporter {
  constructor() {
    this.dataPath = path.join(__dirname, 'db', 'data_wilayah');
    this.outputPath = path.join(__dirname, 'json_export');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  async exportProvinsi() {
    console.log('📍 Exporting Provinsi data to JSON...');
    try {
      const filePath = path.join(this.dataPath, 'provinsi', 'provinsi.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const documents = [];
      const timestamp = new Date();
      
      for (const [code, name] of Object.entries(data)) {
        documents.push({
          type: 'provinsi',
          code: code,
          fullCode: code,
          name: name,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      
      const outputFile = path.join(this.outputPath, 'provinsi.json');
      fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`✅ Exported ${documents.length} provinsi records to ${outputFile}`);
      return documents;
    } catch (error) {
      console.error('❌ Error exporting provinsi:', error);
      return [];
    }
  }

  async exportKabupatenKota() {
    console.log('🏙️ Exporting Kabupaten/Kota data to JSON...');
    try {
      const kabupatenPath = path.join(this.dataPath, 'kabupaten_kota');
      const files = fs.readdirSync(kabupatenPath).filter(file => file.endsWith('.json'));
      
      const documents = [];
      const timestamp = new Date();
      
      for (const file of files) {
        const provinsiCode = file.match(/kab-(\d+)\.json/)?.[1];
        if (!provinsiCode) continue;
        
        const filePath = path.join(kabupatenPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${code}`;
          documents.push({
            type: 'kabupaten_kota',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode,
            createdAt: timestamp,
            updatedAt: timestamp
          });
        }
      }
      
      const outputFile = path.join(this.outputPath, 'kabupaten_kota.json');
      fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`✅ Exported ${documents.length} kabupaten/kota records to ${outputFile}`);
      return documents;
    } catch (error) {
      console.error('❌ Error exporting kabupaten/kota:', error);
      return [];
    }
  }

  async exportKecamatan() {
    console.log('🏘️ Exporting Kecamatan data to JSON...');
    try {
      const kecamatanPath = path.join(this.dataPath, 'kecamatan');
      const files = fs.readdirSync(kecamatanPath).filter(file => file.endsWith('.json'));
      
      const documents = [];
      const timestamp = new Date();
      
      for (const file of files) {
        const match = file.match(/kec-(\d+)-(\d+)\.json/);
        if (!match) continue;
        
        const [, provinsiCode, kabupatenCode] = match;
        const filePath = path.join(kecamatanPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${kabupatenCode}${code}`;
          documents.push({
            type: 'kecamatan',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode,
            kabupatenKotaCode: kabupatenCode,
            kabupatenKotaFullCode: `${provinsiCode}${kabupatenCode}`,
            createdAt: timestamp,
            updatedAt: timestamp
          });
        }
      }
      
      const outputFile = path.join(this.outputPath, 'kecamatan.json');
      fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`✅ Exported ${documents.length} kecamatan records to ${outputFile}`);
      return documents;
    } catch (error) {
      console.error('❌ Error exporting kecamatan:', error);
      return [];
    }
  }

  async exportKelurahanDesa() {
    console.log('🏡 Exporting Kelurahan/Desa data to JSON...');
    try {
      const kelurahanPath = path.join(this.dataPath, 'kelurahan_desa');
      const files = fs.readdirSync(kelurahanPath).filter(file => file.endsWith('.json'));
      
      const documents = [];
      const timestamp = new Date();
      let processedFiles = 0;
      const total = files.length;
      
      for (const file of files) {
        const match = file.match(/keldesa-(\d+)-(\d+)-(\d+)\.json/);
        if (!match) continue;
        
        const [, provinsiCode, kabupatenCode, kecamatanCode] = match;
        const filePath = path.join(kelurahanPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${kabupatenCode}${kecamatanCode}${code}`;
          documents.push({
            type: 'kelurahan_desa',
            code: code,
            fullCode: fullCode,
            name: name,
            provinsiCode: provinsiCode,
            kabupatenKotaCode: kabupatenCode,
            kecamatanCode: kecamatanCode,
            kabupatenKotaFullCode: `${provinsiCode}${kabupatenCode}`,
            kecamatanFullCode: `${provinsiCode}${kabupatenCode}${kecamatanCode}`,
            createdAt: timestamp,
            updatedAt: timestamp
          });
        }
        
        processedFiles++;
        if (processedFiles % 1000 === 0) {
          console.log(`📊 Progress: ${processedFiles}/${total} files processed`);
        }
      }
      
      const outputFile = path.join(this.outputPath, 'kelurahan_desa.json');
      fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`✅ Exported ${documents.length} kelurahan/desa records to ${outputFile}`);
      return documents;
    } catch (error) {
      console.error('❌ Error exporting kelurahan/desa:', error);
      return [];
    }
  }

  async createCombinedFile(provinsi, kabupatenKota, kecamatan, kelurahanDesa) {
    console.log('📄 Creating combined wilayah JSON file...');
    try {
      const allDocuments = [
        ...provinsi,
        ...kabupatenKota,
        ...kecamatan,
        ...kelurahanDesa
      ];
      
      const outputFile = path.join(this.outputPath, 'wilayah_combined.json');
      fs.writeFileSync(outputFile, JSON.stringify(allDocuments, null, 2), 'utf8');
      
      console.log(`✅ Created combined file: ${outputFile}`);
      console.log(`📊 Total records: ${allDocuments.length}`);
      
      return allDocuments.length;
    } catch (error) {
      console.error('❌ Error creating combined file:', error);
      return 0;
    }
  }

  async createMongoImportFiles(provinsi, kabupatenKota, kecamatan, kelurahanDesa) {
    console.log('📄 Creating mongoimport-compatible JSONL files...');
    try {
      const allDocuments = [
        ...provinsi,
        ...kabupatenKota,
        ...kecamatan,
        ...kelurahanDesa
      ];
      
      // Create JSONL file (one JSON object per line)
      const jsonlLines = allDocuments.map(doc => JSON.stringify(doc));
      const jsonlContent = jsonlLines.join('\n');
      
      const outputFile = path.join(this.outputPath, 'wilayah_mongoimport.jsonl');
      fs.writeFileSync(outputFile, jsonlContent, 'utf8');
      
      console.log(`✅ Created mongoimport file: ${outputFile}`);
      console.log(`📊 Total records: ${allDocuments.length}`);
      
      // Create import script
      const importScript = `# MongoDB Import Commands
# Make sure you have mongoimport installed and your MongoDB connection is working

# Import all wilayah data
mongoimport --uri "${process.env.MONGODB_URI || 'mongodb://localhost:27017/wilayah'}" --collection wilayahs --file wilayah_mongoimport.jsonl

# Or import to MongoDB Atlas (replace with your connection string)
# mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/wilayah" --collection wilayahs --file wilayah_mongoimport.jsonl

# Import individual collections
# mongoimport --uri "${process.env.MONGODB_URI || 'mongodb://localhost:27017/wilayah'}" --collection provinsi --file provinsi.json --jsonArray
# mongoimport --uri "${process.env.MONGODB_URI || 'mongodb://localhost:27017/wilayah'}" --collection kabupaten_kota --file kabupaten_kota.json --jsonArray
# mongoimport --uri "${process.env.MONGODB_URI || 'mongodb://localhost:27017/wilayah'}" --collection kecamatan --file kecamatan.json --jsonArray
# mongoimport --uri "${process.env.MONGODB_URI || 'mongodb://localhost:27017/wilayah'}" --collection kelurahan_desa --file kelurahan_desa.json --jsonArray
`;
      
      const scriptFile = path.join(this.outputPath, 'import_commands.txt');
      fs.writeFileSync(scriptFile, importScript, 'utf8');
      
      console.log(`✅ Created import script: ${scriptFile}`);
      
      return allDocuments.length;
    } catch (error) {
      console.error('❌ Error creating mongoimport files:', error);
      return 0;
    }
  }

  async exportAll() {
    console.log('🚀 Starting Indonesian Area Data Export to JSON');
    console.log('=' * 60);
    
    const startTime = Date.now();
    
    const provinsi = await this.exportProvinsi();
    const kabupatenKota = await this.exportKabupatenKota();
    const kecamatan = await this.exportKecamatan();
    const kelurahanDesa = await this.exportKelurahanDesa();
    
    const totalRecords = await this.createCombinedFile(provinsi, kabupatenKota, kecamatan, kelurahanDesa);
    await this.createMongoImportFiles(provinsi, kabupatenKota, kecamatan, kelurahanDesa);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Export Summary:');
    console.log('=' * 40);
    console.log(`📍 Provinsi: ${provinsi.length.toLocaleString()} records`);
    console.log(`🏙️ Kabupaten/Kota: ${kabupatenKota.length.toLocaleString()} records`);
    console.log(`🏘️ Kecamatan: ${kecamatan.length.toLocaleString()} records`);
    console.log(`🏡 Kelurahan/Desa: ${kelurahanDesa.length.toLocaleString()} records`);
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`📈 Total records: ${totalRecords.toLocaleString()}`);
    console.log(`📁 Export folder: ${this.outputPath}`);
    
    console.log('\n📋 Import Options:');
    console.log('=' * 40);
    console.log('1. 📊 MongoDB Atlas Web Interface:');
    console.log('   - Use the CSV files in csv_export folder');
    console.log('   - Import through "Browse Collections" interface');
    
    console.log('\n2. 💻 MongoDB Compass:');
    console.log('   - Use wilayah_combined.json file');
    console.log('   - Import through Compass GUI');
    
    console.log('\n3. 🔧 Command Line (mongoimport):');
    console.log(`   - cd ${this.outputPath}`);
    console.log('   - mongoimport --uri "your-mongodb-uri" --collection wilayahs --file wilayah_mongoimport.jsonl');
    
    console.log('\n4. 🚀 Direct Node.js Upload:');
    console.log('   - Fix the MongoDB Atlas connectivity issue first');
    console.log('   - Then run: node upload-wilayah-mongodb.js');
    
    console.log('\n🎉 JSON export completed successfully!');
  }
}

// Main execution
async function main() {
  const exporter = new WilayahJSONExporter();
  
  try {
    await exporter.exportAll();
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the export
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WilayahJSONExporter;
