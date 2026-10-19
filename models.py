"""Schémas de données (Pydantic) de l'API."""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


# ---------- Produits ----------
class ProduitIn(BaseModel):
    nom: str
    description: Optional[str] = None
    secteur: str = Field(..., description="Ex. : agroalimentaire, technologie, services, cosmétique")
    prix_unitaire: Optional[float] = Field(None, ge=0)
    cout_unitaire: Optional[float] = Field(None, ge=0)


class Produit(ProduitIn):
    id: int


# ---------- Plans ----------
class PlanIn(BaseModel):
    produit_id: int
    titre: str
    objectif: Optional[str] = None
    positionnement: Optional[str] = None
    strategie_produit: Optional[str] = None
    strategie_prix: Optional[str] = None
    strategie_distribution: Optional[str] = None
    strategie_promotion: Optional[str] = None
    date_lancement: Optional[str] = Field(None, description="Format AAAA-MM-JJ")
    budget_total: float = Field(0, ge=0)
    statut: Literal["brouillon", "valide", "en_cours", "termine"] = "brouillon"


class Plan(PlanIn):
    id: int


# ---------- Composantes ----------
class SegmentIn(BaseModel):
    nom: str
    description: Optional[str] = None
    taille_estimee: Optional[int] = Field(None, ge=0)


class Segment(SegmentIn):
    id: int
    plan_id: int


class ActionIn(BaseModel):
    phase: Optional[str] = None
    canal: str
    description: str
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    cout_prevu: float = Field(0, ge=0)


class Action(ActionIn):
    id: int
    plan_id: int


class BudgetLigneIn(BaseModel):
    canal: str
    montant_prevu: float = Field(..., ge=0)


class BudgetLigne(BudgetLigneIn):
    id: int
    plan_id: int


class BudgetResume(BaseModel):
    plan_id: int
    budget_total: float
    total_alloue: float
    reste_a_allouer: float
    lignes: List[BudgetLigne]


# ---------- Module génération ----------
class GenerationIn(BaseModel):
    produit_id: int
    cible: Literal["B2C", "B2B"] = "B2C"
    budget_total: float = Field(..., gt=0)
    date_lancement: str = Field(..., description="Format AAAA-MM-JJ")
    titre: Optional[str] = None
    couts_fixes: Optional[float] = Field(
        None, ge=0, description="Coûts fixes de lancement, pour le calcul du seuil de rentabilité"
    )


# ---------- Module suivi ----------
class ResultatIn(BaseModel):
    canal: str
    depense_reelle: float = Field(0, ge=0)
    prospects: int = Field(0, ge=0)
    clients_acquis: int = Field(0, ge=0)
    chiffre_affaires: float = Field(0, ge=0)
    periode: Optional[str] = Field(None, description="Ex. : 2026-11 ou T1-2027")


class Resultat(ResultatIn):
    id: int
    plan_id: int


class EcartCanal(BaseModel):
    canal: str
    budget_prevu: float
    depense_reelle: float
    ecart_budget: float
    prospects: int
    clients_acquis: int
    chiffre_affaires: float
    taux_conversion_pct: Optional[float]
    cout_acquisition_client: Optional[float]
    roi_pct: Optional[float]


class EcartsPlan(BaseModel):
    plan_id: int
    budget_prevu_total: float
    depense_reelle_totale: float
    chiffre_affaires_total: float
    roi_global_pct: Optional[float]
    canaux: List[EcartCanal]
