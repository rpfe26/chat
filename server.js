
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
// Sur une VM, on utilise souvent le port 3000 ou 8080
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Initialisation de la base de données JSON
if (!fs.existsSync(DB_PATH)) {
  console.log("📝 Initialisation de la base de données db.json...");
  fs.writeFileSync(DB_PATH, JSON.stringify({ sessions: [] }, null, 2));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Erreur de lecture DB:", err);
    return { sessions: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Erreur d'écriture DB:", err);
  }
};

// --- API Endpoints ---
app.get('/api/sessions', (req, res) => {
  const db = readDB();
  res.json(db.sessions);
});

app.post('/api/sessions', (req, res) => {
  const db = readDB();
  const newSession = req.body;
  db.sessions.push(newSession);
  writeDB(db);
  res.status(201).json(newSession);
});

app.put('/api/sessions/:id', (req, res) => {
  const db = readDB();
  const index = db.sessions.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    db.sessions[index] = { ...db.sessions[index], ...req.body };
    writeDB(db);
    res.json(db.sessions[index]);
  } else {
    res.status(404).send('Session non trouvée');
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  const db = readDB();
  db.sessions = db.sessions.filter(s => s.id !== req.params.id);
  writeDB(db);
  res.status(204).send();
});

// --- Service Statique (Frontend Build) ---
// On sert les fichiers du dossier 'dist' générés par npm run build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Route "Catch-all" pour les applications Single Page (SPA)
// Redirige toutes les requêtes non-API vers index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend non compilé. Lancez 'npm run build' sur la VM.");
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 PEDAGOCHAT EST EN LIGNE
  ---------------------------
  Port    : ${PORT}
  Mode    : Production (VM Linux)
  Accès   : http://0.0.0.0:${PORT}
  Database: ${DB_PATH}
  `);
});
