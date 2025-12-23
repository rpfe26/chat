
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
1. **Compiler le frontend** : `npm run build`
2. **Lancer le serveur** : `npm run server`
- Accès : `http://localhost:3000`

### Option B : Mode Développement
1. Dans un terminal : `npm run server`
2. Dans un second terminal : `npm run dev`
- Accès : `http://localhost:5173`

## 🌍 Intégration WordPress / CMS

Pour identifier automatiquement vos élèves connectés, ajoutez les paramètres `v_name` et `v_id` à l'URL de l'iframe.

**Exemple de code PHP pour WordPress :**
```php
<?php
$current_user = wp_get_current_user();
$user_name = urlencode($current_user->display_name);
$user_id = $current_user->ID;
$chat_url = "https://votre-site.com/#/embed/ID_SESSION?v_name=$user_name&v_id=$user_id";
?>
<iframe src="<?php echo $chat_url; ?>" width="100%" height="600px" frameborder="0"></iframe>
```

*Note : Les espaces dans le nom sont automatiquement gérés s'ils sont remplacés par des underscores `_` ou encodés.*

## ⚠️ Dépannage (EADDRINUSE)
- Linux/Mac : `fuser -k 3000/tcp`
- Windows : `taskkill /F /IM node.exe`

---
*Propulsé par Google Gemini & React.*
