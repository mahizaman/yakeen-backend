const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
// Automatically create the uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 
app.use(express.static(__dirname)); // ADD THIS LINE: It allows the server to load your logo file

// Serve the HTML pages directly
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/privacy-policy', (req, res) => res.sendFile(path.join(__dirname, 'privacy-policy.html')));

// Add these new pages!
app.get('/jobs.html', (req, res) => res.sendFile(path.join(__dirname, 'jobs.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/services.html', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));

// Setup Storage for Images, Gallery, and Videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Simple JSON Database setup
const dbFile = './database.json';
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ visas: {}, jobs: [], gallery: [] }));
}

const readDB = () => JSON.parse(fs.readFileSync(dbFile));
const writeDB = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

// --- API ENDPOINTS ---

// --- API ENDPOINTS ---

// 1. Upload Media (Categorized)
app.post('/api/upload', upload.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Read the category from the form (defaults to gallery if none provided)
    const category = req.body.category || 'gallery'; 
    const db = readDB();
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Ensure the category array exists in the database
    if (!db[category]) {
        db[category] = [];
    }

    // Save it to the correct category in database.json
    db[category].push({ 
        url: fileUrl, 
        type: req.file.mimetype,
        dateAdded: new Date().toLocaleDateString()
    });
    
    writeDB(db);
    res.json({ message: 'File uploaded successfully', url: fileUrl, category: category });
});

// 2. Get Media by Category
app.get('/api/media/:category', (req, res) => {
    const category = req.params.category;
    const db = readDB();
    if (db[category]) {
        res.json(db[category]);
    } else {
        res.json([]); // Return empty list if category doesn't exist yet
    }
});

// 3. Visa Tracker (Update Status - Admin Only)
app.post('/api/visa/update', (req, res) => {
    const { passportNumber, status, notes } = req.body;
    const db = readDB();
    db.visas[passportNumber] = { status, notes, lastUpdated: new Date() };
    writeDB(db);
    res.json({ message: 'Visa status updated' });
});

// 4. Visa Tracker (Check Status - For Users)
app.get('/api/visa/:passportNumber', (req, res) => {
    const db = readDB();
    const visa = db.visas[req.params.passportNumber];
    if (visa) {
        res.json(visa);
    } else {
        res.status(404).json({ error: 'Passport not found in system' });
    }
});

// 5. Jobs (Add New Job)
app.post('/api/jobs', (req, res) => {
    const { title, location, description } = req.body;
    const db = readDB();
    const newJob = { id: Date.now(), title, location, description };
    db.jobs.push(newJob);
    writeDB(db);
    res.json({ message: 'Job added successfully', job: newJob });
});

// 6. Jobs (Get All Jobs)
app.get('/api/jobs', (req, res) => {
    res.json(readDB().jobs);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Yakeen International Backend running at http://localhost:${PORT}`);
});