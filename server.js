const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Force the uploads folder to exist so Render doesn't crash
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// 2. Middleware: The Permission Slips
app.use(cors()); // This tells Render "Yes, allow Netlify to talk to me!"
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname));

// 3. Multer Setup (File Upload Engine)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

// Database File Paths
const dbPath = './database.json';

// Helper function to read/write DB
function readDB() {
    if (!fs.existsSync(dbPath)) return { circulars: [], gallery: [], testimonials: [] };
    return JSON.parse(fs.readFileSync(dbPath));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// 4. The Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });
        
        const category = req.body.category; // 'circulars', 'gallery', or 'testimonials'
        const db = readDB();
        
        // Add new file record to database
        const newRecord = {
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype,
            dateAdded: new Date().toLocaleDateString()
        };

        if(db[category]) {
            db[category].push(newRecord);
            writeDB(db);
            res.status(200).json({ message: "Success!", record: newRecord });
        } else {
            res.status(400).json({ error: "Invalid category" });
        }
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Server crashed during upload." });
    }
});

// 5. Get Media Routes
app.get('/api/media/:category', (req, res) => {
    const category = req.params.category;
    const db = readDB();
    if(db[category]) {
        res.json(db[category]);
    } else {
        res.status(404).json({ error: "Category not found" });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});