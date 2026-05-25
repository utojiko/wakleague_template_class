# Wakfu PvP Overlay

Interface web Angular pour gérer et afficher les classes de deux équipes lors de combats PvP sur Wakfu — conçue comme overlay Streamlabs OBS.

DÉPLOYER L'APPLICATION (GitHub Pages)

Ce dépôt contient déjà des scripts npm pour faciliter le déploiement sur GitHub Pages. Deux options :

- Build seul (prépare les fichiers avec le bon `base-href`) :

```bash
npm run github-build
```

- Build + publication sur GitHub Pages (utilise `angular-cli-ghpages` via `npx`) :

```bash
npm run github-deploy
```

Que fait `github-deploy` :
- construit l'application en production avec le `base-href` adapté (`/wakleague_template_class/` par défaut),
- copie `index.html` en `404.html` pour permettre le refresh sur GitHub Pages,
- publie le dossier `dist/wakfu-overlay/browser` sur la branche gh-pages.

Remarque importante : le `base-href` utilisé par le script est `/wakleague_template_class/`. Si votre dépôt GitHub a un nom différent, adaptez la valeur de `github-build` dans `package.json` (ou exécutez manuellement `ng build --configuration production --base-href /NOM_DU_REPO/`).

Si vous préférez héberger sur la branche `docs/` (GitHub Pages via `docs`), vous pouvez aussi :

```bash
ng build --output-path docs --base-href /NOM_DU_REPO/
```

Puis pousser la branche principale contenant le dossier `docs/`.

## 🚀 Démarrage rapide

```bash
npm install
ng serve
```

Puis ouvrez [http://localhost:4200](http://localhost:4200)

## 🎯 Fonctionnalités

- **Gestion des équipes** : 2 équipes (gauche/droite), 1 à 6 classes chacune
- **18 classes Wakfu** disponibles via une grille de sélection
- **Marquage des morts** : cliquez sur une classe pour la griser / la marquer morte
- **Drag & Drop** : réorganisez les classes dans les équipes
- **Sauvegarde automatique** dans le localStorage
- **Mode Overlay** pour Streamlabs OBS

## 📁 Structure

```
src/
├── app/
│   ├── models/
│   │   └── game-class.model.ts          # Interfaces + liste des 18 classes
│   ├── services/
│   │   └── game-state.service.ts        # État global (Angular Signals + localStorage)
│   ├── components/
│   │   ├── class-card/                  # Affichage d'une classe (avec état mort)
│   │   ├── class-selector/              # Grille de sélection des 18 classes
│   │   └── team-display/                # Affichage côte à côte des équipes
│   ├── app.ts                           # Composant racine + détection mode overlay
│   └── app.config.ts
└── assets/
    └── classes/                         # Images SVG des classes (remplaçables)
```

## 🎨 Remplacement des images

Remplacez les fichiers dans `src/assets/classes/` par des images réelles de vos classes.  
Les noms de fichiers doivent correspondre aux IDs définis dans `src/app/models/game-class.model.ts`.

## 🔧 Build de production

```bash
ng build
```

Les fichiers sont générés dans `dist/wakfu-overlay/browser/`.
