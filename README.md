# Wakfu PvP Overlay

Interface web Angular pour gérer et afficher les classes de deux équipes lors de combats PvP sur Wakfu — conçue comme overlay Streamlabs OBS.

DÉPLOYER L'APPLICATION 
ng build --output-path docs --base-href /wakleague_template_class/

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

## 🖥️ Mode Overlay (Streamlabs OBS)

Ajoutez `?overlay=true` à l'URL dans votre source navigateur :

```
http://localhost:4200/?overlay=true
```

En mode overlay :
- Les contrôles de sélection sont masqués
- Seules les équipes sont affichées
- Le fond est transparent

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
