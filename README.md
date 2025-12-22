
# Explorateur de Documentation avec Gemini

Cette application permet d'analyser des documentations textuelles et des ressources vidéo en utilisant l'IA Gemini. Elle est optimisée pour une interaction fluide et une analyse multimédia.

## Installation sur Debian (ou Ubuntu)

Suivez ces étapes pour installer et lancer l'application sur un serveur ou une machine Debian.

### 1. Mise à jour du système et installation de Node.js

Ouvrez un terminal et exécutez les commandes suivantes :

```bash
# Mise à jour des dépôts
sudo apt update

# Installation de curl si nécessaire
sudo apt install -y curl

# Installation de Node.js (Version 20 recommandée)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification des versions
node -v
npm -v
```

### 2. Clonage et Installation du Projet

```bash
# Cloner le dépôt (remplacez par votre URL GitHub)
git clone https://github.com/votre-utilisateur/explorateur-docs-gemini.git
cd explorateur-docs-gemini

# Installer les dépendances
npm install
```

### 3. Configuration de la Clé API

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez le fichier `.env` et ajoutez votre clé API Gemini obtenue sur [Google AI Studio](https://aistudio.google.com/app/apikey) :
```env
API_KEY=votre_cle_ici
```

### 4. Lancement

**En mode développement :**
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

**En mode production (Build) :**
```bash
npm run build
# Les fichiers générés se trouveront dans le dossier /dist
```

## Fonctionnalités
- 📄 Analyse de documentation via URL.
- 🎥 Support des vidéos (YouTube, Vimeo, fichiers directs).
- 💬 Chat intelligent en français.
- 🌙 Interface sombre (Dark Mode) moderne.
- 📱 Design responsive pour mobile et bureau.

## Licence
Apache-2.0
