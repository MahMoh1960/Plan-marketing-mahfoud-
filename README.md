# Plan marketing – application mobile autonome

Application web (sans serveur) pour concevoir, générer et suivre le plan marketing
de lancement d'un nouveau produit. Usage professionnel et pédagogique.
Les données sont conservées sur l'appareil (stockage local du navigateur).

Un plan suit les six rubriques d'un plan marketing : résumé managérial, audit, objectifs et stratégie,
marketing mix, plan d'action et budget, pilotage et contrôle.

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

## Mise à jour vers la version « six rubriques »

Seuls les fichiers `app.js`, `style.css` et `sw.js` changent par rapport à la première version.
`index.html` reste identique.

1. Dans le dépôt, « Add file » > « Upload files », puis déposez ces fichiers à la racine
   (ils remplacent les anciens du même nom) et validez avec « Commit changes ».
2. Attendez une à deux minutes, puis rouvrez l'application. Si l'ancien affichage persiste,
   fermez complètement l'application (ou l'onglet) et rouvrez-la une fois de plus.
3. Vos plans existants sont conservés. Ils sont migrés automatiquement : les textes d'exemple
   des anciennes versions sont retirés (les champs correspondants restent vides, à compléter), les textes
   que vous avez saisis vous-même sont conservés dans la rubrique « Marketing mix ».

Pour l'APK : le dépôt d'un fichier sur la branche `main` relance la compilation. Une fois terminée,
exportez d'abord votre sauvegarde (Outils > Exporter), désinstallez l'ancienne application,
installez la nouvelle puis réimportez la sauvegarde (Outils > Importer).

## Mise en ligne sur GitHub Pages (première fois)

1. Dans le dépôt, « Add file » > « Upload files », puis déposez les fichiers directement
   (sans dossier) et validez avec « Commit changes ».
2. « Settings » > « Pages » > « Build and deployment » : Source « Deploy from a branch »,
   branche `main`, dossier `/ (root)`, puis « Save ». Le dépôt doit être public.
3. Après une à deux minutes, l'adresse de l'application s'affiche en haut de la page
   (de la forme `https://<compte>.github.io/<dépôt>/`).

## Utilisation sur téléphone (Android)

Ouvrez l'adresse dans Chrome, puis menu ⋮ > « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
Après la première visite, l'application fonctionne aussi hors connexion.

## Version APK (compilation par GitHub Actions)

Aucun dossier n'est à créer : GitHub crée lui-même le dossier du workflow.

1. Onglet « Actions » > « New workflow » > « set up a workflow yourself ».
2. Effacez le contenu proposé, collez tout le contenu de `build-apk.yml`, puis « Commit changes ».
3. La compilation démarre seule (cinq à dix minutes). Sinon : Actions > « Compiler l'APK » > « Run workflow ».
4. Une fois la coche verte affichée, ouvrez l'exécution et, tout en bas, section « Artifacts »,
   téléchargez `plan-marketing-apk` (fichier ZIP). Décompressez-le (application Fichiers) : il contient `app-debug.apk`.
5. Ouvrez `app-debug.apk` et autorisez l'installation depuis cette source si Android le demande.

Remarques :
- L'APK est signé avec une clé de test, régénérée à chaque compilation. Pour installer une version plus récente,
  il faut d'abord désinstaller l'ancienne : **exportez votre sauvegarde avant**, puis réimportez-la.
- Dans l'APK, « Exporter » ouvre le partage Android (Drive, e-mail, Fichiers).

## Les six rubriques

Un bandeau en haut du plan présente les six rubriques. Chacune affiche une coche lorsqu'elle est complète,
sinon le nombre de critères remplis (par exemple 2/4). Le bouton « ? » affiche la définition de la rubrique.

1. **Résumé managérial** : informations générales du plan, puis résumé composé automatiquement à partir des
   autres rubriques (constats de l'audit, objectifs phares, axe stratégique, enveloppe budgétaire). Bouton « Copier le résumé ».
   Coche lorsque les rubriques 2, 3 et 5 sont complètes.
2. **Audit** : PESTEL, marché et concurrence, 5 forces de Porter, analyse interne, matrice SWOT, facteurs clés de succès.
   Chaque formulaire affiche, avant chaque champ, des pistes de questions pour guider la réponse ; la réponse saisie
   remplit la carte correspondante. Le formulaire SWOT rappelle en plus les réponses déjà saisies dans le PESTEL,
   le marché, les 5 forces et l'analyse interne, pour les transformer en forces, faiblesses, opportunités et menaces.
   Coche lorsque le PESTEL, le marché/concurrence (ou les 5 forces), l'analyse interne et les quatre cases du SWOT sont renseignés.
3. **Objectifs et stratégie** : objectifs SMART (quantitatifs ou qualitatifs, avec contrôle du caractère SMART complet),
   segments, stratégie de ciblage, positionnement et proposition de valeur, buyer personas.
   Coche : au moins un objectif, un segment, un ciblage choisi, positionnement et proposition de valeur renseignés.
4. **Marketing mix** : 4P pour les biens, bouton pour passer aux 7P (Personnel, Processus, Preuve matérielle) pour les services.
   Coche lorsque tous les P du modèle choisi sont renseignés.
5. **Plan d'action et budget** : actions et calendrier (liste chronologique), budget par canal, compte d'exploitation
   prévisionnel (contribution marketing nette, ROMI prévisionnel), seuil de rentabilité.
   Coche : au moins une action, une ligne de budget et les ventes prévues renseignées.
6. **Pilotage** : indicateurs (taux de conversion, CAC, contribution marketing nette, ROMI), LTV, part de voix,
   écarts prévu/réalisé par canal, résultats réels, plan de contingence.
   Coche : au moins un résultat, la LTV renseignée et un scénario de contingence.

La fonction « Générer » crée uniquement la structure : budget réparti par canal et calendrier en trois phases.
Les rubriques (audit, stratégie, mix…) restent vides, à compléter : aucune donnée de marché n'est inventée.

## Formules

- Taux de conversion = clients acquis / prospects × 100
- Coût d'acquisition client (CAC) = dépense réelle / clients acquis
- Contribution marketing nette = marge brute − frais marketing directs
  (prévisionnel : marge brute = ventes prévues × (prix − coût unitaire) ; frais = somme des lignes de budget, à défaut le budget total)
- ROMI = contribution marketing nette / frais marketing × 100
  (suivi réel : marge brute = chiffre d'affaires × taux de marge, avec taux de marge = (prix − coût) / prix)
- Valeur vie client (LTV) = marge moyenne par client et par an × durée moyenne de la relation (en années)
- Seuil de rentabilité (unités) = (coûts fixes + budget marketing) / (prix − coût unitaire)

Le ROMI et la contribution exigent que le prix et le coût unitaires du produit soient renseignés.
La part de voix (part de vos dépenses de communication dans celles du marché) est saisie à la main.
Les répartitions budgétaires par canal et les phases sont indicatives et modifiables
dans `app.js` (constantes `REPARTITION`, `PHASES`, `POIDS`).

## Important

Les données restent sur l'appareil : exportez régulièrement une sauvegarde (Outils > Exporter).
Vider les données du navigateur efface les données de l'application.
