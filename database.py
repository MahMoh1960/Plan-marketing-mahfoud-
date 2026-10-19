"""Accès à la base SQLite et création du schéma."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "marketing.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    secteur TEXT NOT NULL,
    prix_unitaire REAL,
    cout_unitaire REAL
);
CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    objectif TEXT,
    positionnement TEXT,
    strategie_produit TEXT,
    strategie_prix TEXT,
    strategie_distribution TEXT,
    strategie_promotion TEXT,
    date_lancement TEXT,
    budget_total REAL NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT 'brouillon'
);
CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    taille_estimee INTEGER
);
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    phase TEXT,
    canal TEXT NOT NULL,
    description TEXT NOT NULL,
    date_debut TEXT,
    date_fin TEXT,
    cout_prevu REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    canal TEXT NOT NULL,
    montant_prevu REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS resultats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    canal TEXT NOT NULL,
    depense_reelle REAL NOT NULL DEFAULT 0,
    prospects INTEGER NOT NULL DEFAULT 0,
    clients_acquis INTEGER NOT NULL DEFAULT 0,
    chiffre_affaires REAL NOT NULL DEFAULT 0,
    periode TEXT
);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
