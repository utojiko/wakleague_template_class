Configuration Firebase (Realtime Database) pour les sessions partagées

1) Créer un projet Firebase
- Rendez-vous sur https://console.firebase.google.com/ et créez un projet gratuit.

2) Activer Realtime Database
- Dans le menu « Build » → « Realtime Database », créez une base de données et choisissez le mode "Start in test mode" (pour développement).
- Note: le mode test permet l'accès sans authentification pendant 30 jours; pour la production configurez des règles appropriées.

3) Récupérer la configuration Web
- Dans la page du projet, cliquez sur l'icône web «</>» pour ajouter une app Web.
- Copiez l'objet de configuration JS (apiKey, authDomain, databaseURL, projectId, etc.).

4) Injecter la config dans l'app
- Dans `src/index.html` (ou via votre pipeline), ajoutez juste avant le script principal une balise <script> qui définit `window.__FIREBASE_CONFIG__` :

```html
<script>
  window.__FIREBASE_CONFIG__ = {
    apiKey: "...",
    authDomain: "...",
    databaseURL: "https://<your-project>.firebaseio.com",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  };
</script>
```

5) Déployer sur GitHub Pages
- Votre site statique (GitHub Pages) peut utiliser la config ci-dessus; la synchronisation temps-réel se fera via la Realtime Database.
- Assurez-vous que `databaseURL` est correct et que les règles de la DB permettent l'accès selon votre usage.

6) Utilisation
- Ouvrez une session partagée : `https://<user>.github.io/wakleague_template_class/<SESSION_ID>`
- Cliquez sur le bouton de copie d'URL dans l'interface pour générer un `SESSION_ID` si vous n'en avez pas.
- Tous les navigateurs connectés sur la même `SESSION_ID` recevront les mises à jour en temps réel.

Remarques
- Firebase Realtime Database offre un quota gratuit suffisant pour de petits usages (streams personnels). Si vous prévoyez un trafic élevé, vérifiez les limites et quotas.
- Si vous préférez une solution sans backend, la synchronisation via `localStorage` ne marche que pour les onglets du même navigateur/profil.
