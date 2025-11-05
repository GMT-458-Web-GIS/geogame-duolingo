import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// API endpoint - GeoJSON dosyasını serve etmek
app.get('/api/map-data', (req, res) => {
    const geoJsonPath = path.join(__dirname, 'databases', 'maps', 'custom.geo.json');
    res.sendFile(geoJsonPath, (err) => {
        if (err) {
            console.log('GeoJSON dosyası bulunamadı, boş veri gönderiliyor');
            res.json({ type: 'FeatureCollection', features: [] });
        }
    });
});

// Statik dosyalar
app.use(express.static(path.join(__dirname)));

// Hata handling
app.use((req, res) => {
    res.status(404).send('Sayfa bulunamadı');
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🌍 DuoGIS sunucusu çalışıyor: http://localhost:${PORT}`);
    console.log(`📍 Ana sayfa: http://localhost:${PORT}`);
    console.log(`🗺️  Harita sayfası: http://localhost:${PORT}/main`);
    console.log(`\nSunucuyu durdurmak için: Ctrl+C`);
});
