const fs = require('fs');
const path = require('path');

class WilayahCSVExporter {
  constructor() {
    this.dataPath = path.join(__dirname, 'db', 'data_wilayah');
    this.outputPath = path.join(__dirname, 'csv_export');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  escapeCSV(value) {
    if (typeof value !== 'string') return value;
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportProvinsi() {
    console.log('📍 Exporting Provinsi data to CSV...');
    try {
      const filePath = path.join(this.dataPath, 'provinsi', 'provinsi.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const csvLines = ['type,code,fullCode,name,createdAt,updatedAt'];
      const timestamp = new Date().toISOString();
      
      for (const [code, name] of Object.entries(data)) {
        const line = [
          'provinsi',
          code,
          code, // fullCode same as code for provinsi
          this.escapeCSV(name),
          timestamp,
          timestamp
        ].join(',');
        csvLines.push(line);
      }
      
      const csvContent = csvLines.join('\n');
      const outputFile = path.join(this.outputPath, 'provinsi.csv');
      fs.writeFileSync(outputFile, csvContent, 'utf8');
      
      console.log(`✅ Exported ${csvLines.length - 1} provinsi records to ${outputFile}`);
      return csvLines.length - 1;
    } catch (error) {
      console.error('❌ Error exporting provinsi:', error);
      return 0;
    }
  }

  async exportKabupatenKota() {
    console.log('🏙️ Exporting Kabupaten/Kota data to CSV...');
    try {
      const kabupatenPath = path.join(this.dataPath, 'kabupaten_kota');
      const files = fs.readdirSync(kabupatenPath).filter(file => file.endsWith('.json'));
      
      const csvLines = ['type,code,fullCode,name,provinsiCode,createdAt,updatedAt'];
      const timestamp = new Date().toISOString();
      
      for (const file of files) {
        const provinsiCode = file.match(/kab-(\d+)\.json/)?.[1];
        if (!provinsiCode) continue;
        
        const filePath = path.join(kabupatenPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${code}`;
          const line = [
            'kabupaten_kota',
            code,
            fullCode,
            this.escapeCSV(name),
            provinsiCode,
            timestamp,
            timestamp
          ].join(',');
          csvLines.push(line);
        }
      }
      
      const csvContent = csvLines.join('\n');
      const outputFile = path.join(this.outputPath, 'kabupaten_kota.csv');
      fs.writeFileSync(outputFile, csvContent, 'utf8');
      
      console.log(`✅ Exported ${csvLines.length - 1} kabupaten/kota records to ${outputFile}`);
      return csvLines.length - 1;
    } catch (error) {
      console.error('❌ Error exporting kabupaten/kota:', error);
      return 0;
    }
  }

  async exportKecamatan() {
    console.log('🏘️ Exporting Kecamatan data to CSV...');
    try {
      const kecamatanPath = path.join(this.dataPath, 'kecamatan');
      const files = fs.readdirSync(kecamatanPath).filter(file => file.endsWith('.json'));
      
      const csvLines = ['type,code,fullCode,name,provinsiCode,kabupatenKotaCode,kabupatenKotaFullCode,createdAt,updatedAt'];
      const timestamp = new Date().toISOString();
      
      for (const file of files) {
        const match = file.match(/kec-(\d+)-(\d+)\.json/);
        if (!match) continue;
        
        const [, provinsiCode, kabupatenCode] = match;
        const filePath = path.join(kecamatanPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const [code, name] of Object.entries(data)) {
          const fullCode = `${provinsiCode}${kabupatenCode}${code}`;
          const line = [
            'kecamatan',
            code,
            fullCode,
            this.escapeCSV(name),
            provinsiCode,
            kabupatenCode,
            `${provinsiCode}${kabupatenCode}`,
            timestamp,
            timestamp
          ].join(',');
          csvLines.push(line);
        }
      }
      
      const csvContent = csvLines.join('\n');
      const outputFile = path.join(this.outputPath, 'kecamatan.csv');
      fs.writeFileSync(outputFile, csvContent, 'utf8');
      
      console.log(`✅ Exported ${csvLines.length - 1} kecamatan records to ${outputFile}`);
      return csvLines.length - 1;
    } catch (error) {
      console.error('❌ Error exporting kecamatan:', error);
      return 0;
    }
  }

  async exportKelurahanDesa() {
    console.log('🏡 Exporting Kelurahan/Desa data to CSV...');
    try {
      const kelurahanPath = path.join(this.dataPath, 'kelurahan_desa');
      const files = fs.readdirSync(kelurahanPath).filter(file => file.endsWith('.json'));
      
      const csvLines = ['type,code,fullCode,name,provinsiCode,kabupatenKotaCode,kecamatanCode,kabupatenKotaFullCode,kecamatanFullCode,createdAt,updatedAt'];
      const timestamp = new Date().toISOString();
      
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
          const line = [
            'kelurahan_desa',
            code,
            fullCode,
            this.escapeCSV(name),
            provinsiCode,
            kabupatenCode,
            kecamatanCode,
            `${provinsiCode}${kabupatenCode}`,
            `${provinsiCode}${kabupatenCode}${kecamatanCode}`,
            timestamp,
            timestamp
          ].join(',');
          csvLines.push(line);
        }
        
        processedFiles++;
        if (processedFiles % 1000 === 0) {
          console.log(`📊 Progress: ${processedFiles}/${total} files processed`);
        }
      }
      
      const csvContent = csvLines.join('\n');
      const outputFile = path.join(this.outputPath, 'kelurahan_desa.csv');
      fs.writeFileSync(outputFile, csvContent, 'utf8');
      
      console.log(`✅ Exported ${csvLines.length - 1} kelurahan/desa records to ${outputFile}`);
      return csvLines.length - 1;
    } catch (error) {
      console.error('❌ Error exporting kelurahan/desa:', error);
      return 0;
    }
  }

  async createCombinedFile() {
    console.log('📄 Creating combined wilayah CSV file...');
    try {
      const csvFiles = [
        'provinsi.csv',
        'kabupaten_kota.csv', 
        'kecamatan.csv',
        'kelurahan_desa.csv'
      ];
      
      const combinedLines = ['type,code,fullCode,name,provinsiCode,kabupatenKotaCode,kecamatanCode,kabupatenKotaFullCode,kecamatanFullCode,createdAt,updatedAt'];
      
      for (const csvFile of csvFiles) {
        const filePath = path.join(this.outputPath, csvFile);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').slice(1); // Skip header
          
          // Pad missing columns for consistency
          lines.forEach(line => {
            if (line.trim()) {
              const cols = line.split(',');
              while (cols.length < 11) {
                cols.splice(-2, 0, ''); // Insert empty before timestamps
              }
              combinedLines.push(cols.join(','));
            }
          });
        }
      }
      
      const combinedContent = combinedLines.join('\n');
      const outputFile = path.join(this.outputPath, 'wilayah_combined.csv');
      fs.writeFileSync(outputFile, combinedContent, 'utf8');
      
      console.log(`✅ Created combined file: ${outputFile}`);
      console.log(`📊 Total records: ${combinedLines.length - 1}`);
      
      return combinedLines.length - 1;
    } catch (error) {
      console.error('❌ Error creating combined file:', error);
      return 0;
    }
  }

  async exportAll() {
    console.log('🚀 Starting Indonesian Area Data Export to CSV');
    console.log('=' * 60);
    
    const startTime = Date.now();
    
    const stats = {
      provinsi: await this.exportProvinsi(),
      kabupaten_kota: await this.exportKabupatenKota(),
      kecamatan: await this.exportKecamatan(),
      kelurahan_desa: await this.exportKelurahanDesa()
    };
    
    const totalRecords = await this.createCombinedFile();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Export Summary:');
    console.log('=' * 40);
    console.log(`📍 Provinsi: ${stats.provinsi.toLocaleString()} records`);
    console.log(`🏙️ Kabupaten/Kota: ${stats.kabupaten_kota.toLocaleString()} records`);
    console.log(`🏘️ Kecamatan: ${stats.kecamatan.toLocaleString()} records`);
    console.log(`🏡 Kelurahan/Desa: ${stats.kelurahan_desa.toLocaleString()} records`);
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`📈 Total records: ${totalRecords.toLocaleString()}`);
    console.log(`📁 Export folder: ${this.outputPath}`);
    
    console.log('\n📋 Instructions for MongoDB Atlas Import:');
    console.log('1. Go to your MongoDB Atlas dashboard');
    console.log('2. Navigate to your cluster and click "Browse Collections"');
    console.log('3. Create a new database called "wilayah" if not exists');
    console.log('4. Create a collection called "wilayahs"');
    console.log('5. Click "INSERT DOCUMENT" > "Import File"');
    console.log('6. Upload the wilayah_combined.csv file');
    console.log('7. Map the CSV columns to document fields');
    console.log('8. Import the data');
    
    console.log('\n🎉 CSV export completed successfully!');
  }
}

// Main execution
async function main() {
  const exporter = new WilayahCSVExporter();
  
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

module.exports = WilayahCSVExporter;
