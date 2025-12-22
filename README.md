# Explorateur de Documentation avec Gemini

Cette application permet d'analyser des documentations textuelles et des ressources vidéo en utilisant l'IA Gemini.

## Installation sur Debian

*(Voir les sections précédentes pour l'installation initiale)*

## Mise à jour de l'application

Pour mettre à jour votre instance directement sur le serveur avec les dernières modifications de votre dépôt GitHub :

### 1. Utiliser le script automatique
Nous avons inclus un script `update.sh` pour simplifier l'opération.

```bash
# Rendre le script exécutable (à faire une seule fois)
chmod +x update.sh

# Lancer la mise à jour
./update.sh
```

### 2. Gestion en arrière-plan avec PM2 (Recommandé)
Pour éviter que l'application ne s'arrête quand vous fermez votre terminal SSH, utilisez **PM2** :

```bash
# Installation de PM2 globalement
sudo npm install -g pm2

# Lancer l'application en mode développement (écoute réseau)
pm2 start "npm run dev" --name "explorateur-docs"

# Pour que PM2 se lance au démarrage du serveur
pm2 startup
pm2 save
```

**Commandes utiles PM2 :**
- `pm2 status` : Voir si l'app tourne.
- `pm2 logs explorateur-docs` : Voir les erreurs en temps réel.
- `pm2 restart explorateur-docs` : Redémarrer après une modification.

## Configuration Réseau (Rappel)
- **Port** : 5173
- **IP** : Utilisez `hostname -I` pour trouver l'adresse de votre serveur.
- **Pare-feu** : `sudo ufw allow 5173/tcp`

## Licence
Apache-2.0
