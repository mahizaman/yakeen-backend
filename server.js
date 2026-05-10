const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. CLOUDINARY VAULT SETUP ---
cloudinary.config({
    cloud_name: 'ds4t0pjmw', // I added your exact Cloud Name here!
    api_key: '123951967232861',
    api_secret: 'G7kEZZ-Cq3tcc2GEAtiR6PExLVM'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'yakeen_media', // Cloudinary will create this folder for you
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov']
    },
});
const upload = multer({ storage: storage });

// Database File Path
const dbPath = './database.json';

function readDB() {
    if (!fs.existsSync(dbPath)) return { circulars: [], gallery: [], testimonials: [] };
    return JSON.parse(fs.readFileSync(dbPath));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// --- 2. THE PERMANENT UPLOAD ROUTE ---
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });

        const category = req.body.category;
        const db = readDB();

        // req.file.path is the permanent, live Cloudinary URL!
        const newRecord = {
            url: req.file.path, 
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

// Get Media Routes
app.get('/api/media/:category', (req, res) => {
    const category = req.params.category;
    const db = readDB();
    if(db[category]) {
        res.json(db[category]);
    } else {
        res.status(404).json({ error: "Category not found" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});