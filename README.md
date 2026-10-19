# API Plan marketing – lancement de nouveaux produits

API REST (FastAPI + SQLite) pour concevoir, générer et suivre le plan marketing
de lancement d'un nouveau produit. Usage professionnel et pédagogique.

## Fichiers (à placer dans un même dossier, tous au même niveau)

| Fichier | Rôle |
|---|---|
| `main.py` | Endpoints de l'API (socle, génération, suivi) |
| `models.py` | Schémas de données |
| `database.py` | Base SQLite et création des tables |
| `requirements.txt` | Dépendances Python |
| `README.md` | Ce guide |

Sur GitHub : déposez ces cinq fichiers directement à la racine du dépôt
(« Add file » > « Upload files »), sans dossier.

## Installation et lancement

```
pip install -r requirements.txt
uvicorn main:app --reload
```

Documentation interactive : http://127.0.0.1:8000/docs
La base `marketing.db` est créée automatiquement au premier lancement.

## Fonctionnalités

**1. Socle (CRUD)**
- `/produits` : produits à lancer (secteur, prix, coût unitaire)
- `/plans` : plans marketing (objectif, positionnement, 4P, date, budget, statut)
- `/plans/{id}/mix` : mix marketing (4P)
- `/plans/{id}/segments`, `/plans/{id}/actions` (calendrier), `/plans/{id}/budget`

**2. Génération assistée**
- `POST /plans/generer` : crée un plan type (brouillon) avec segment, budget réparti
  par canal (B2C ou B2B), calendrier en trois phases (préparation, lancement,
  consolidation) et seuil de rentabilité si `couts_fixes` est fourni.
  Les répartitions sont indicatives et modifiables dans `main.py`
  (constantes `REPARTITION`, `PHASES`).

**3. Suivi**
- `POST /plans/{id}/resultats` : saisie des résultats réels par canal
- `GET /plans/{id}/ecarts` : écart budgétaire, taux de conversion,
  coût d'acquisition client et ROI par canal

## Exemple rapide

1. `POST /produits` : `{"nom": "Huile d'argan bio", "secteur": "cosmétique", "prix_unitaire": 120, "cout_unitaire": 70}`
2. `POST /plans/generer` : `{"produit_id": 1, "cible": "B2C", "budget_total": 200000, "date_lancement": "2027-01-15", "couts_fixes": 100000}`
3. `POST /plans/1/resultats` : `{"canal": "Réseaux sociaux", "depense_reelle": 50000, "prospects": 2000, "clients_acquis": 150, "chiffre_affaires": 18000}`
4. `GET /plans/1/ecarts`

## Formules

- Taux de conversion = clients acquis / prospects × 100
- Coût d'acquisition = dépense réelle / clients acquis
- ROI = (chiffre d'affaires − dépense réelle) / dépense réelle × 100
- Seuil de rentabilité (unités) = (coûts fixes + budget marketing) / (prix − coût unitaire)
