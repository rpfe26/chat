
# 🎓 PedagoChat Fullstack

Assistant pédagogique intelligent basé sur Gemini 3 Flash, avec un backend Node.js pour la persistance des données et un mode de repli local (localStorage) pour les tests.

## 🛠️ Prérequis

- **Node.js** : Version 18.0.0 ou supérieure.
- **Clé API Gemini** : Obtenez-en une sur [Google AI Studio](https://aistudio.google.com/).

## 🚀 Installation Rapide

1. **Cloner ou télécharger le projet** dans un dossier local.
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Configurer l'environnement** :
   Créez un fichier `.env` à la racine du projet :
   ```env
   API_KEY=votre_cle_api_ici
   ```

## 💻 Modes d'Exécution

### 1. Mode Développement (Frontend uniquement)
Idéal pour tester l'interface rapidement. Les données seront sauvegardées dans le **localStorage** de votre navigateur (Mode Local).
```bash
npm run dev
```
- Accès : `http://localhost:5173`
- *Note : L'indicateur de stockage affichera "Local (Test)".*

### 2. Mode Serveur (Fullstack - Recommandé)
Ce mode permet la persistance réelle dans un fichier `db.json` partagé.
**Important :** Vous devez construire le frontend avant de lancer le serveur.

```bash
# Étape A : Compiler le frontend
npm run build

# Étape B : Lancer le serveur
npm run server
```
- Accès : `http://localhost:5173`
- *Note : L'indicateur de stockage affichera "Serveur".*

## 📁 Structure du Projet

- `server.js` : Backend Express gérant l'API et servant les fichiers statiques.
- `db.json` : "Base de données" générée automatiquement (ne pas supprimer).
- `dist/` : Dossier contenant l'application compilée (généré par `npm run build`).
- `services/apiService.ts` : Logique hybride qui bascule entre le serveur et le local.

## ⚠️ Dépannage (Troubleshooting)

- **Erreur "Fichier dist/index.html non trouvé"** : Assurez-vous d'avoir bien exécuté `npm run build` avant `npm run server`.
- **Port déjà utilisé** : Si le port 5173 est pris, vous pouvez modifier la variable `PORT` dans `server.js` ou dans votre environnement.
- **Données non sauvegardées** : Vérifiez que l'utilisateur exécutant le serveur a les droits d'écriture dans le dossier racine pour modifier `db.json`.
- **Quota Exceeded** : Si l'IA ne répond plus, c'est que vous avez atteint la limite gratuite de votre clé API Gemini. Attendez une minute avant de réessayer.

## 🔒 Sécurité
- Le fichier `.env` est listé dans `.gitignore` pour éviter de publier votre clé API.
- Le backend accepte des fichiers jusqu'à 50MB pour supporter les PDF volumineux via l'API.

---
*Propulsé par Google Gemini & React.*
