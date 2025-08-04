const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Import API handlers
const wilayahHandler = require('./api/wilayah.js');
const provinsiHandler = require('./api/provinsi.js');
const kabupatenKotaHandler = require('./api/kabupaten-kota.js');
const kecamatanHandler = require('./api/kecamatan.js');
const kelurahanDesaHandler = require('./api/kelurahan-desa.js');
const statsHandler = require('./api/stats.js');
const healthHandler = require('./api/health.js');

// API routes
app.all('/api/wilayah', (req, res) => wilayahHandler(req, res));
app.all('/api/provinsi', (req, res) => provinsiHandler(req, res));
app.all('/api/kabupaten-kota', (req, res) => kabupatenKotaHandler(req, res));
app.all('/api/kecamatan', (req, res) => kecamatanHandler(req, res));
app.all('/api/kelurahan-desa', (req, res) => kelurahanDesaHandler(req, res));
app.all('/api/stats', (req, res) => statsHandler(req, res));
app.all('/api/health', (req, res) => healthHandler(req, res));

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📊 API health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 API stats: http://localhost:${PORT}/api/stats`);
});
