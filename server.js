
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
// Changement du port par défaut à 3000 pour éviter le conflit avec le port 5173 de Vite
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('dist'));

// Initialisation de la "base de données"
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ sessions: [] }, null, 2));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { sessions: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// API Endpoints
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

// Route par défaut pour le SPA
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.send('Serveur API PedagoChat en ligne. Accédez à l\'application via le port de build ou de dev.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur PedagoChat lancé sur http://localhost:${PORT}`);
});
