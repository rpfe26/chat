
# 🎓 PedagoChat Fullstack

Assistant pédagogique intelligent basé sur Gemini 3 Flash, avec un backend Node.js pour la persistance des données.

## 🛠️ Prérequis

- **Node.js** : Version 18.0.0 ou supérieure.
- **Clé API Gemini** : Obtenez-en une sur [Google AI Studio](https://aistudio.google.com/).

## 🚀 Installation Rapide

1. **Installer les dépendances** :
   ```bash
   npm install
   ```
2. **Configurer l'environnement** :
   Créez un fichier `.env` à la racine :
   ```env
   API_KEY=votre_cle_api_ici
   ```

## 💻 Modes d'Exécution

### Option A : Mode Fullstack Complet (Production/Stable)
C'est le mode recommandé pour utiliser l'application avec sauvegarde réelle.
1. **Compiler le frontend** : `npm run build`
2. **Lancer le serveur** : `npm run server`
- Accès : `http://localhost:3000`

### Option B : Mode Développement (Hautement recommandé pour modif)
Permet de modifier le code en temps réel tout en sauvegardant sur le serveur.
1. Dans un terminal, lancez le serveur : `npm run server`
2. Dans un second terminal, lancez vite : `npm run dev`
- Accès : `http://localhost:5173`
- *Les appels API seront redirigés automatiquement du port 5173 vers le port 3000.*

## ⚠️ Dépannage (EADDRINUSE)

Si vous voyez l'erreur `EADDRINUSE`, cela signifie qu'un processus utilise déjà le port. 
- Pour libérer le port 3000 ou 5173 sur Linux/Mac : `fuser -k 3000/tcp`
- Sur Windows : `taskkill /F /IM node.exe`

---
*Propulsé par Google Gemini & React.*
