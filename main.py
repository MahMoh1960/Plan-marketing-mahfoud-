"""API Plan marketing de lancement de nouveaux produits (option D : socle + génération + suivi).

Lancer :  uvicorn main:app --reload
Docs   :  http://127.0.0.1:8000/docs
"""
from datetime import date, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException

from database import get_connection, init_db
from models import (
    Action, ActionIn, BudgetLigne, BudgetLigneIn, BudgetResume, EcartCanal,
    EcartsPlan, GenerationIn, Plan, PlanIn, Produit, ProduitIn, Resultat,
    ResultatIn, Segment, SegmentIn,
)

app = FastAPI(
    title="API Plan marketing – lancement de nouveaux produits",
    description="Socle CRUD, génération assistée de plan et suivi des écarts prévu/réalisé.",
    version="1.0.0",
)


@app.on_event("startup")
def demarrage() -> None:
    init_db()


# ======================================================================
# Utilitaires
# ======================================================================
def _exiger(conn, table: str, id_: int, libelle: str) -> dict:
    ligne = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (id_,)).fetchone()
    if ligne is None:
        raise HTTPException(404, f"{libelle} {id_} introuvable")
    return dict(ligne)


def _inserer(conn, table: str, donnees: dict) -> int:
    colonnes = ", ".join(donnees)
    marques = ", ".join("?" for _ in donnees)
    cur = conn.execute(
        f"INSERT INTO {table} ({colonnes}) VALUES ({marques})", tuple(donnees.values())
    )
    return cur.lastrowid


def _modifier(conn, table: str, id_: int, donnees: dict) -> None:
    sets = ", ".join(f"{c} = ?" for c in donnees)
    conn.execute(f"UPDATE {table} SET {sets} WHERE id = ?", (*donnees.values(), id_))


# ======================================================================
# 1. SOCLE : produits
# ======================================================================
@app.post("/produits", response_model=Produit, status_code=201, tags=["Produits"])
def creer_produit(p: ProduitIn):
    with get_connection() as conn:
        id_ = _inserer(conn, "produits", p.model_dump())
        return _exiger(conn, "produits", id_, "Produit")


@app.get("/produits", response_model=List[Produit], tags=["Produits"])
def lister_produits():
    with get_connection() as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM produits ORDER BY id")]


@app.get("/produits/{produit_id}", response_model=Produit, tags=["Produits"])
def lire_produit(produit_id: int):
    with get_connection() as conn:
        return _exiger(conn, "produits", produit_id, "Produit")


@app.put("/produits/{produit_id}", response_model=Produit, tags=["Produits"])
def modifier_produit(produit_id: int, p: ProduitIn):
    with get_connection() as conn:
        _exiger(conn, "produits", produit_id, "Produit")
        _modifier(conn, "produits", produit_id, p.model_dump())
        return _exiger(conn, "produits", produit_id, "Produit")


@app.delete("/produits/{produit_id}", status_code=204, tags=["Produits"])
def supprimer_produit(produit_id: int):
    with get_connection() as conn:
        _exiger(conn, "produits", produit_id, "Produit")
        conn.execute("DELETE FROM produits WHERE id = ?", (produit_id,))


# ======================================================================
# 1. SOCLE : plans
# ======================================================================
@app.post("/plans", response_model=Plan, status_code=201, tags=["Plans"])
def creer_plan(p: PlanIn):
    with get_connection() as conn:
        _exiger(conn, "produits", p.produit_id, "Produit")
        id_ = _inserer(conn, "plans", p.model_dump())
        return _exiger(conn, "plans", id_, "Plan")


@app.get("/plans", response_model=List[Plan], tags=["Plans"])
def lister_plans(produit_id: Optional[int] = None, statut: Optional[str] = None):
    requete, params = "SELECT * FROM plans WHERE 1=1", []
    if produit_id is not None:
        requete += " AND produit_id = ?"
        params.append(produit_id)
    if statut:
        requete += " AND statut = ?"
        params.append(statut)
    with get_connection() as conn:
        return [dict(r) for r in conn.execute(requete + " ORDER BY id", params)]


@app.get("/plans/{plan_id}", response_model=Plan, tags=["Plans"])
def lire_plan(plan_id: int):
    with get_connection() as conn:
        return _exiger(conn, "plans", plan_id, "Plan")


@app.put("/plans/{plan_id}", response_model=Plan, tags=["Plans"])
def modifier_plan(plan_id: int, p: PlanIn):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        _exiger(conn, "produits", p.produit_id, "Produit")
        _modifier(conn, "plans", plan_id, p.model_dump())
        return _exiger(conn, "plans", plan_id, "Plan")


@app.delete("/plans/{plan_id}", status_code=204, tags=["Plans"])
def supprimer_plan(plan_id: int):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        conn.execute("DELETE FROM plans WHERE id = ?", (plan_id,))


@app.get("/plans/{plan_id}/mix", tags=["Plans"])
def lire_mix_marketing(plan_id: int):
    """Mix marketing (4P) du plan."""
    with get_connection() as conn:
        p = _exiger(conn, "plans", plan_id, "Plan")
    return {
        "plan_id": plan_id,
        "produit": p["strategie_produit"],
        "prix": p["strategie_prix"],
        "distribution": p["strategie_distribution"],
        "promotion": p["strategie_promotion"],
    }


# ======================================================================
# 1. SOCLE : segments, actions, budget
# ======================================================================
@app.post("/plans/{plan_id}/segments", response_model=Segment, status_code=201, tags=["Segments"])
def ajouter_segment(plan_id: int, s: SegmentIn):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        id_ = _inserer(conn, "segments", {"plan_id": plan_id, **s.model_dump()})
        return _exiger(conn, "segments", id_, "Segment")


@app.get("/plans/{plan_id}/segments", response_model=List[Segment], tags=["Segments"])
def lister_segments(plan_id: int):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        return [dict(r) for r in conn.execute(
            "SELECT * FROM segments WHERE plan_id = ? ORDER BY id", (plan_id,))]


@app.delete("/segments/{segment_id}", status_code=204, tags=["Segments"])
def supprimer_segment(segment_id: int):
    with get_connection() as conn:
        _exiger(conn, "segments", segment_id, "Segment")
        conn.execute("DELETE FROM segments WHERE id = ?", (segment_id,))


@app.post("/plans/{plan_id}/actions", response_model=Action, status_code=201, tags=["Actions"])
def ajouter_action(plan_id: int, a: ActionIn):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        id_ = _inserer(conn, "actions", {"plan_id": plan_id, **a.model_dump()})
        return _exiger(conn, "actions", id_, "Action")


@app.get("/plans/{plan_id}/actions", response_model=List[Action], tags=["Actions"])
def lister_actions(plan_id: int):
    """Calendrier du plan, trié par date de début."""
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        return [dict(r) for r in conn.execute(
            "SELECT * FROM actions WHERE plan_id = ? ORDER BY date_debut, id", (plan_id,))]


@app.delete("/actions/{action_id}", status_code=204, tags=["Actions"])
def supprimer_action(action_id: int):
    with get_connection() as conn:
        _exiger(conn, "actions", action_id, "Action")
        conn.execute("DELETE FROM actions WHERE id = ?", (action_id,))


@app.post("/plans/{plan_id}/budget", response_model=BudgetLigne, status_code=201, tags=["Budget"])
def ajouter_ligne_budget(plan_id: int, b: BudgetLigneIn):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        id_ = _inserer(conn, "budgets", {"plan_id": plan_id, **b.model_dump()})
        return _exiger(conn, "budgets", id_, "Ligne de budget")


@app.get("/plans/{plan_id}/budget", response_model=BudgetResume, tags=["Budget"])
def lire_budget(plan_id: int):
    with get_connection() as conn:
        plan = _exiger(conn, "plans", plan_id, "Plan")
        lignes = [dict(r) for r in conn.execute(
            "SELECT * FROM budgets WHERE plan_id = ? ORDER BY id", (plan_id,))]
    total_alloue = round(sum(l["montant_prevu"] for l in lignes), 2)
    return {
        "plan_id": plan_id,
        "budget_total": plan["budget_total"],
        "total_alloue": total_alloue,
        "reste_a_allouer": round(plan["budget_total"] - total_alloue, 2),
        "lignes": lignes,
    }


@app.delete("/budgets/{ligne_id}", status_code=204, tags=["Budget"])
def supprimer_ligne_budget(ligne_id: int):
    with get_connection() as conn:
        _exiger(conn, "budgets", ligne_id, "Ligne de budget")
        conn.execute("DELETE FROM budgets WHERE id = ?", (ligne_id,))


# ======================================================================
# 2. MODULE GÉNÉRATION (simplifié)
# ======================================================================
# Répartition indicative du budget par canal (somme = 1). Valeurs pédagogiques
# modifiables : elles ne constituent pas une norme sectorielle.
REPARTITION = {
    "B2C": {
        "Réseaux sociaux": 0.30,
        "Publicité en ligne": 0.25,
        "Promotion en point de vente": 0.20,
        "Relations presse / influence": 0.15,
        "Études et suivi": 0.10,
    },
    "B2B": {
        "Force de vente": 0.35,
        "Marketing de contenu": 0.20,
        "Salons et événements": 0.20,
        "Marketing direct / e-mailing": 0.15,
        "Études et suivi": 0.10,
    },
}

# Phases du calendrier : (nom, décalage début en jours, décalage fin en jours)
PHASES = [
    ("Préparation", -60, -1),
    ("Lancement", 0, 30),
    ("Consolidation", 31, 90),
]
# Poids des phases dans l'étalement des coûts d'actions
POIDS_PHASES = {"Préparation": 0.25, "Lancement": 0.50, "Consolidation": 0.25}


@app.post("/plans/generer", tags=["Génération"], status_code=201)
def generer_plan(g: GenerationIn):
    """Génère un plan type (4P, segment, budget par canal, calendrier, seuil de rentabilité)."""
    try:
        lancement = date.fromisoformat(g.date_lancement)
    except ValueError:
        raise HTTPException(422, "date_lancement doit respecter le format AAAA-MM-JJ")

    with get_connection() as conn:
        produit = _exiger(conn, "produits", g.produit_id, "Produit")
        plan_id = _inserer(conn, "plans", {
            "produit_id": g.produit_id,
            "titre": g.titre or f"Plan de lancement – {produit['nom']}",
            "objectif": f"Lancer {produit['nom']} sur le marché {g.cible} et atteindre le seuil de rentabilité",
            "positionnement": f"À définir : proposition de valeur distinctive de {produit['nom']} dans le secteur {produit['secteur']}",
            "strategie_produit": "Gamme, qualité, marque et conditionnement à préciser",
            "strategie_prix": "Prix d'écrémage, de pénétration ou d'alignement à arbitrer",
            "strategie_distribution": "Distribution directe, en ligne ou via intermédiaires selon la cible",
            "strategie_promotion": "Mix des canaux ci-dessous, avec calendrier en trois phases",
            "date_lancement": g.date_lancement,
            "budget_total": g.budget_total,
            "statut": "brouillon",
        })
        _inserer(conn, "segments", {
            "plan_id": plan_id,
            "nom": "Cible principale" if g.cible == "B2C" else "Entreprises cibles",
            "description": "Segment à qualifier (démographie, besoins, comportement d'achat)",
            "taille_estimee": None,
        })

        # Budget par canal
        repartition = REPARTITION[g.cible]
        for canal, part in repartition.items():
            _inserer(conn, "budgets", {
                "plan_id": plan_id, "canal": canal,
                "montant_prevu": round(g.budget_total * part, 2),
            })

        # Calendrier : une action par canal et par phase (hors « Études et suivi »)
        canaux_actifs = [c for c in repartition if c != "Études et suivi"]
        for canal in canaux_actifs:
            budget_canal = g.budget_total * repartition[canal]
            for nom_phase, debut, fin in PHASES:
                _inserer(conn, "actions", {
                    "plan_id": plan_id,
                    "phase": nom_phase,
                    "canal": canal,
                    "description": f"{nom_phase} – {canal}",
                    "date_debut": (lancement + timedelta(days=debut)).isoformat(),
                    "date_fin": (lancement + timedelta(days=fin)).isoformat(),
                    "cout_prevu": round(budget_canal * POIDS_PHASES[nom_phase], 2),
                })

    # Seuil de rentabilité (facultatif)
    seuil = None
    prix, cout = produit["prix_unitaire"], produit["cout_unitaire"]
    if g.couts_fixes is not None and prix is not None and cout is not None:
        marge = prix - cout
        seuil = {
            "marge_unitaire": round(marge, 2),
            "couts_fixes_retenus": round(g.couts_fixes + g.budget_total, 2),
            "unites_a_vendre": (round((g.couts_fixes + g.budget_total) / marge)
                                if marge > 0 else None),
            "remarque": ("Marge unitaire nulle ou négative : seuil non atteignable"
                         if marge <= 0 else
                         "Calcul : (coûts fixes + budget marketing) / marge unitaire"),
        }
    return {"plan_id": plan_id, "seuil_rentabilite": seuil,
            "message": "Plan généré en brouillon ; consultez /plans/{id}, /budget et /actions"}


# ======================================================================
# 3. MODULE SUIVI (simplifié)
# ======================================================================
@app.post("/plans/{plan_id}/resultats", response_model=Resultat, status_code=201, tags=["Suivi"])
def saisir_resultat(plan_id: int, r: ResultatIn):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        id_ = _inserer(conn, "resultats", {"plan_id": plan_id, **r.model_dump()})
        return _exiger(conn, "resultats", id_, "Résultat")


@app.get("/plans/{plan_id}/resultats", response_model=List[Resultat], tags=["Suivi"])
def lister_resultats(plan_id: int):
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        return [dict(r) for r in conn.execute(
            "SELECT * FROM resultats WHERE plan_id = ? ORDER BY id", (plan_id,))]


def _ratio(num: float, den: float, facteur: float = 1.0) -> Optional[float]:
    return round(num / den * facteur, 2) if den else None


@app.get("/plans/{plan_id}/ecarts", response_model=EcartsPlan, tags=["Suivi"])
def calculer_ecarts(plan_id: int):
    """Écart prévu/réalisé, taux de conversion, coût d'acquisition et ROI par canal.

    Taux de conversion = clients acquis / prospects × 100
    Coût d'acquisition  = dépense réelle / clients acquis
    ROI                 = (chiffre d'affaires − dépense réelle) / dépense réelle × 100
    """
    with get_connection() as conn:
        _exiger(conn, "plans", plan_id, "Plan")
        prevus = {r["canal"]: r["total"] for r in conn.execute(
            "SELECT canal, SUM(montant_prevu) AS total FROM budgets "
            "WHERE plan_id = ? GROUP BY canal", (plan_id,))}
        reels = {r["canal"]: dict(r) for r in conn.execute(
            "SELECT canal, SUM(depense_reelle) AS depense, SUM(prospects) AS prospects, "
            "SUM(clients_acquis) AS clients, SUM(chiffre_affaires) AS ca "
            "FROM resultats WHERE plan_id = ? GROUP BY canal", (plan_id,))}

    canaux, tot_prevu, tot_depense, tot_ca = [], 0.0, 0.0, 0.0
    for canal in sorted(set(prevus) | set(reels)):
        prevu = prevus.get(canal, 0.0)
        r = reels.get(canal, {"depense": 0.0, "prospects": 0, "clients": 0, "ca": 0.0})
        depense, ca = r["depense"] or 0.0, r["ca"] or 0.0
        tot_prevu += prevu
        tot_depense += depense
        tot_ca += ca
        canaux.append(EcartCanal(
            canal=canal,
            budget_prevu=round(prevu, 2),
            depense_reelle=round(depense, 2),
            ecart_budget=round(depense - prevu, 2),
            prospects=r["prospects"] or 0,
            clients_acquis=r["clients"] or 0,
            chiffre_affaires=round(ca, 2),
            taux_conversion_pct=_ratio(r["clients"] or 0, r["prospects"] or 0, 100),
            cout_acquisition_client=_ratio(depense, r["clients"] or 0),
            roi_pct=_ratio(ca - depense, depense, 100),
        ))
    return EcartsPlan(
        plan_id=plan_id,
        budget_prevu_total=round(tot_prevu, 2),
        depense_reelle_totale=round(tot_depense, 2),
        chiffre_affaires_total=round(tot_ca, 2),
        roi_global_pct=_ratio(tot_ca - tot_depense, tot_depense, 100),
        canaux=canaux,
    )
