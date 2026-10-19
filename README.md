# Plan marketing – application mobile autonome

Application web (sans serveur) pour concevoir, générer et suivre le plan marketing
de lancement d'un nouveau produit. Usage professionnel et pédagogique.
Les données sont conservées sur l'appareil (stockage local du navigateur).

## Fichiers (tous au même niveau, à la racine du dépôt GitHub)

| Fichier | Rôle |
|---|---|
| `index.html` | Page principale |
| `style.css` | Présentation (mode clair/sombre automatique) |
| `app.js` | Logique de l'application |
| `manifest.json` | Installation sur l'écran d'accueil |
| `sw.js` | Fonctionnement hors ligne |
| `icon-192.png`, `icon-512.png` | Icônes de l'application |
| `build-apk.yml` | Procédure de compilation de l'APK (à coller dans GitHub Actions, voir plus bas) |
| `README.md` | Ce guide |

## Mise en ligne sur GitHub Pages

1. Dans le dépôt, « Add file » > « Upload files », puis déposez les 8 fichiers directement
   (sans dossier) et validez avec « Commit changes ».
2. « Settings » > « Pages » > « Build and deployment » : Source « Deploy from a branch »,
   branche `main`, dossier `/ (root)`, puis « Save ».
3. Après une à deux minutes, l'adresse de l'application s'affiche en haut de la page
   (de la forme `https://<compte>.github.io/<dépôt>/`).

Il n'y a rien à configurer dans l'onglet « Actions ».

## Utilisation sur téléphone (Android)

Ouvrez l'adresse dans Chrome, puis menu ⋮ > « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
Après la première visite, l'application fonctionne aussi hors connexion.

## Version APK (compilation par GitHub Actions)

Aucun dossier n'est à créer : GitHub crée lui-même le dossier du workflow.

1. Remplacez `app.js` dans le dépôt par la nouvelle version (elle gère l'export de sauvegarde dans l'APK).
2. Onglet « Actions » > « New workflow » > « set up a workflow yourself ».
3. Effacez le contenu proposé, collez tout le contenu de `build-apk.yml`, puis « Commit changes ».
4. La compilation démarre seule (cinq à dix minutes). Sinon : Actions > « Compiler l'APK » > « Run workflow ».
5. Une fois la coche verte affichée, ouvrez l'exécution et, tout en bas, section « Artifacts »,
   téléchargez `plan-marketing-apk` (fichier ZIP). Décompressez-le (application Fichiers) : il contient `app-debug.apk`.
6. Ouvrez `app-debug.apk` et autorisez l'installation depuis cette source si Android le demande.

Remarques :
- L'APK est signé avec une clé de test, régénérée à chaque compilation. Pour installer une version plus récente,
  il faut d'abord désinstaller l'ancienne : **exportez votre sauvegarde avant** (Outils > Exporter), puis réimportez-la.
- Dans l'APK, « Exporter » ouvre le partage Android (Drive, e-mail, Fichiers).
- Chaque modification de fichier déposée sur la branche `main` relance une compilation.

## Fonctions

- **Produits** : nom, secteur, prix et coût unitaires.
- **Générer** : plan type (B2C ou B2B) avec budget réparti par canal, calendrier en trois phases
  et seuil de rentabilité.
- **Plans** : synthèse et mix marketing (4P), segments, calendrier, budget, résultats réels, écarts.
- **Écarts** : écart budgétaire, taux de conversion, coût d'acquisition et ROI par canal.
- **Outils** : export/import de sauvegarde (JSON), effacement des données.

## Formules

- Taux de conversion = clients acquis / prospects × 100
- Coût d'acquisition = dépense réelle / clients acquis
- ROI = (chiffre d'affaires − dépense réelle) / dépense réelle × 100
- Seuil de rentabilité (unités) = (coûts fixes + budget marketing) / (prix − coût unitaire)

Les répartitions budgétaires par canal et les phases sont indicatives et modifiables
dans `app.js` (constantes `REPARTITION`, `PHASES`, `POIDS`).

## Important

Les données restent sur l'appareil : exportez régulièrement une sauvegarde (Outils > Exporter).
Vider les données du navigateur efface les données de l'application.
