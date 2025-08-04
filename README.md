
# 🇮🇩 Indonesian Wilayah Data - MongoDB Atlas Setup

🌐 **Live Demo:** [https://indoarea.vercel.app/](https://indoarea.vercel.app/)
---

# 🇮🇩 Dokumentasi Bahasa Indonesia

## 📊 Ringkasan Data
- **38** Provinsi
- **514** Kabupaten/Kota
- **7.288** Kecamatan
- **84.210** Kelurahan/Desa
- **Total: 92.050** wilayah administrasi

## 🚀 Opsi Impor Data

### Opsi 1: MongoDB Atlas Web Interface (Direkomendasikan)
1. Buka dashboard MongoDB Atlas Anda
2. Masuk ke cluster → "Browse Collections"
3. Buat database `wilayah` dan koleksi `wilayahs`
4. Klik "INSERT DOCUMENT" → "Import File"
5. Upload `csv_export/wilayah_combined.csv`
6. Mapping kolom CSV ke field dokumen
7. Import data

### Opsi 2: MongoDB Compass
1. Install MongoDB Compass
2. Koneksikan ke cluster MongoDB Atlas Anda
3. Buat database `wilayah` dan koleksi `wilayahs`
4. Import `json_export/wilayah_combined.json`

### Opsi 3: Command Line (mongoimport)
```bash
cd json_export
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/wilayah" --collection wilayahs --file wilayah_mongoimport.jsonl
```

### Opsi 4: Script Node.js
```bash
node upload-wilayah-mongodb.js
```

## 📁 Struktur Proyek
```
├── data                      # Data JSON asli
├── csv_export/               # File CSV untuk import Atlas
├── json_export/              # File JSON/JSONL untuk Compass/mongoimport
├── server.js                 # API server berbasis MongoDB
├── upload-wilayah-mongodb.js # Script upload langsung
└── .env                      # Konfigurasi environment
```

## 🔧 Konfigurasi Environment
Buat/update file `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wilayah?retryWrites=true&w=majority
PORT=3000
HOST=0.0.0.0
```

## 🌐 Endpoint API (setelah import)
- `GET /api/health` - Cek status API
- `GET /api/provinsi` - Daftar semua provinsi
- `GET /api/provinsi/:code/kabupaten-kota` - Daftar kabupaten/kota per provinsi
- `GET /api/kabupaten-kota/:code/kecamatan` - Daftar kecamatan per kabupaten/kota
- `GET /api/kecamatan/:code/kelurahan-desa` - Daftar kelurahan/desa per kecamatan
- `GET /api/wilayah/search?q=name` - Cari wilayah berdasarkan nama
- `GET /api/wilayah/hierarchy/:fullCode` - Dapatkan hierarki lengkap
- `GET /api/wilayah/stats` - Statistik data

## 🚀 Menjalankan Server
```bash
npm install
npm start
```

## ⚠️ Troubleshooting Koneksi MongoDB Atlas
Jika gagal koneksi:
1. Cek Network Access (IP Whitelist) di MongoDB Atlas
2. Pastikan cluster berjalan dan tidak paused
3. Cek koneksi internet dan firewall
4. Pastikan string koneksi dan kredensial benar

## 📋 Referensi Perintah Import
Lihat `json_export/import_commands.txt` untuk perintah mongoimport detail.

## 🎯 Struktur Data
Setiap dokumen berisi:
- `type`: 'provinsi', 'kabupaten_kota', 'kecamatan', atau 'kelurahan_desa'
- `code`: Kode wilayah lokal
- `fullCode`: Kode hierarki lengkap
- `name`: Nama wilayah
- `provinsiCode`: Kode provinsi induk
- `kabupatenKotaCode`: Kode kabupaten/kota induk (jika ada)
- `kecamatanCode`: Kode kecamatan induk (jika ada)
- Timestamps: `createdAt`, `updatedAt`

## 🔍 Contoh Query
```javascript
// Semua provinsi
db.wilayahs.find({type: "provinsi"})

// Semua kota/kabupaten di DKI Jakarta (31)
db.wilayahs.find({type: "kabupaten_kota", provinsiCode: "31"})

// Cari wilayah mengandung "Jakarta"
db.wilayahs.find({name: /Jakarta/i})

// Hierarki lengkap untuk area tertentu
db.wilayahs.find({fullCode: "3175"}) // Jakarta Barat
```

This project contains complete Indonesian administrative area data (Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa) ready for MongoDB Atlas import.

## 📊 Data Summary
- **38** Provinsi (Provinces)
- **514** Kabupaten/Kota (Regencies/Cities)
- **7,288** Kecamatan (Districts)
- **84,210** Kelurahan/Desa (Villages/Urban Villages)
- **Total: 92,050** administrative areas

## 🚀 Import Options

### Option 1: MongoDB Atlas Web Interface (Recommended)
1. Go to your MongoDB Atlas dashboard
2. Navigate to your cluster → "Browse Collections"
3. Create database `wilayah` and collection `wilayahs`
4. Click "INSERT DOCUMENT" → "Import File"
5. Upload `csv_export/wilayah_combined.csv`
6. Map CSV columns to document fields
7. Import the data

### Option 2: MongoDB Compass
1. Download and install MongoDB Compass
2. Connect to your MongoDB Atlas cluster
3. Create database `wilayah` and collection `wilayahs`
4. Import `json_export/wilayah_combined.json`

### Option 3: Command Line (mongoimport)
```bash
cd json_export
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/wilayah" --collection wilayahs --file wilayah_mongoimport.jsonl
```

### Option 4: Node.js Script (if connection works)
```bash
node upload-wilayah-mongodb.js
```

## 📁 Project Structure
```
├── data                      # Original JSON data files
├── csv_export/               # CSV files for Atlas import
├── json_export/              # JSON/JSONL files for Compass/mongoimport
├── server.js                 # MongoDB-based API server
├── upload-wilayah-mongodb.js # Direct upload script
└── .env                      # Environment configuration
```

## 🔧 Environment Setup
Create/update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wilayah?retryWrites=true&w=majority
PORT=3000
HOST=0.0.0.0
```

## 🌐 API Endpoints (after import)
- `GET /api/health` - Health check
- `GET /api/provinsi` - Get all provinces
- `GET /api/provinsi/:code/kabupaten-kota` - Get regencies/cities by province
- `GET /api/kabupaten-kota/:code/kecamatan` - Get districts by regency/city
- `GET /api/kecamatan/:code/kelurahan-desa` - Get villages by district
- `GET /api/wilayah/search?q=name` - Search areas by name
- `GET /api/wilayah/hierarchy/:fullCode` - Get complete hierarchy
- `GET /api/wilayah/stats` - Get statistics

## 🚀 Start Server
```bash
npm install
npm start
```

## ⚠️ Troubleshooting MongoDB Atlas Connection
If you get connection timeouts:
1. Check MongoDB Atlas Network Access (IP Whitelist)
2. Verify cluster is running and not paused
3. Check your internet connection and firewall
4. Use correct credentials in connection string

## 📋 Import Commands Reference
See `json_export/import_commands.txt` for detailed mongoimport commands.

## 🎯 Data Structure
Each document contains:
- `type`: 'provinsi', 'kabupaten_kota', 'kecamatan', or 'kelurahan_desa'
- `code`: Local area code
- `fullCode`: Complete hierarchical code
- `name`: Area name
- `provinsiCode`: Parent province code
- `kabupatenKotaCode`: Parent regency/city code (if applicable)
- `kecamatanCode`: Parent district code (if applicable)
- Timestamps: `createdAt`, `updatedAt`

## 🔍 Example Queries
```javascript
// Find all provinces
db.wilayahs.find({type: "provinsi"})

// Find all cities in Jakarta (DKI Jakarta = 31)
db.wilayahs.find({type: "kabupaten_kota", provinsiCode: "31"})

// Search for areas containing "Jakarta"
db.wilayahs.find({name: /Jakarta/i})

// Get complete hierarchy for a specific area
db.wilayahs.find({fullCode: "3175"}) // Jakarta Barat
```
