
#!/bin/bash

# Script de déploiement pour PedagoChat sur VM Proxmox
# Usage: chmod +x deploy-vm.sh && ./deploy-vm.sh

echo "🌐 Préparation du déploiement PedagoChat..."

# 1. Vérification de Node.js
if ! command -v node &> /dev/null
then
    echo "📦 Node.js non trouvé. Installation en cours..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Installation de PM2 (Gestionnaire de processus)
if ! command -v pm2 &> /dev/null
then
    echo "⚙️ Installation de PM2..."
    sudo npm install -g pm2
fi

# 3. Installation des dépendances
echo "📥 Installation des dépendances npm..."
npm install

# 4. Build du Frontend
echo "🏗️ Compilation du frontend (Vite)..."
npm run build

# 5. Lancement avec PM2
echo "🚀 Lancement du serveur PedagoChat..."
pm2 delete pedagochat 2>/dev/null || true
pm2 start server.js --name pedagochat

# 6. Configuration du démarrage automatique
echo "🔄 Configuration du démarrage au boot..."
pm2 save
pm2 startup

echo "✅ Déploiement terminé !"
echo "📍 L'application est accessible sur le port 3000 de votre VM."
