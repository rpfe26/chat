
# Explorateur de Documentation avec Gemini

Cette application permet d'analyser des documentations textuelles et des ressources vidéo en utilisant l'IA Gemini.

## Installation sur un Serveur Debian/Ubuntu

Suivez ces étapes pour installer et déployer l'application sur votre serveur.

### Prérequis

Assurez-vous que les éléments suivants sont installés sur votre serveur :

1.  **Node.js et npm (ou Yarn)**:
    ```bash
    sudo apt update
    sudo apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    # Vérifier l'installation
    node -v
    npm -v
    ```
2.  **Git**:
    ```bash
    sudo apt install -y git
    ```

### Étapes d'Installation

1.  **Cloner le dépôt GitHub**:
    ```bash
    git clone https://github.com/votre_utilisateur/votre_repo.git # Remplacez par l'URL de votre dépôt
    cd votre_repo # Naviguez vers le dossier de l'application
    ```

2.  **Installer les dépendances**:
    ```bash
    npm install
    ```

3.  **Configurer la clé API Gemini**:
    Créez un fichier `.env` à la racine du projet et ajoutez votre clé API Gemini.
    ```bash
    echo "API_KEY=VOTRE_CLE_API_GEMINI_ICI" > .env
    ```
    **ATTENTION**: Remplacez `VOTRE_CLE_API_GEMINI_ICI` par votre véritable clé API. Ne partagez jamais ce fichier publiquement.

4.  **Construire l'application pour la production**:
    Cela va créer une version optimisée de l'application dans le dossier `dist/`.
    ```bash
    npm run build
    ```

5.  **Exécuter l'application en arrière-plan avec PM2 (Recommandé)**:
    Pour que l'application reste active même après la fermeture de votre terminal SSH et pour une gestion facile des processus en production :

    ```bash
    # Installation de PM2 globalement (si ce n'est pas déjà fait)
    sudo npm install -g pm2

    # Lancer l'application construite en servant le dossier 'dist' sur le port 5173
    # Le package 'serve' est utilisé ici comme un serveur HTTP simple pour les fichiers statiques.
    sudo npm install -g serve # Installe le package 'serve' globalement si non déjà présent
    pm2 start "serve -s dist -l 5173" --name "pedagochat-app"

    # Pour que PM2 se lance automatiquement au démarrage du serveur
    pm2 startup
    pm2 save
    ```
    Vous pouvez maintenant fermer votre terminal SSH; l'application continuera de fonctionner.

### Configuration Réseau

1.  **Vérifier le Port**: L'application est configurée pour s'exécuter sur le port `5173`.
2.  **Adresse IP**: Pour trouver l'adresse IP de votre serveur, utilisez la commande :
    ```bash
    hostname -I
    ```
3.  **Pare-feu (UFW)**: Si vous utilisez UFW (Uncomplicated Firewall), autorisez le trafic sur le port 5173 :
    ```bash
    sudo ufw allow 5173/tcp
    sudo ufw enable # Active le pare-feu si ce n'est pas déjà fait (attention à ne pas vous bloquer)
    ```

Vous devriez maintenant pouvoir accéder à l'application via `http://VOTRE_IP_SERVEUR:5173` depuis votre navigateur.

## Mise à jour de l'application

Pour mettre à jour votre instance directement sur le serveur avec les dernières modifications de votre dépôt GitHub :

### 1. Utiliser le script automatique `update.sh`
Nous avons inclus un script `update.sh` pour simplifier l'opération.

```bash
# Assurez-vous d'être dans le répertoire racine de l'application
cd /chemin/vers/votre_repo 

# Rendre le script exécutable (à faire une seule fois)
chmod +x update.sh

# Lancer la mise à jour
./update.sh
```

### 2. Vérifier l'état avec PM2
Après la mise à jour, vous pouvez vérifier l'état de votre application avec PM2 :

```bash
pm2 status pedagochat-app
pm2 logs pedagochat-app
```

## Licence
Apache-2.0
