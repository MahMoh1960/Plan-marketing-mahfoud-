'use strict';
/* Plan marketing – lancement de nouveaux produits
   Application autonome : les données sont conservées sur l'appareil (localStorage). */

// ---------------------------------------------------------------- Paramètres
const CLE = 'plan-marketing-v1';

// Répartition indicative du budget par canal (somme = 1). Valeurs pédagogiques, modifiables.
const REPARTITION = {
  B2C: {
    'Réseaux sociaux': 0.30, 'Publicité en ligne': 0.25, 'Promotion en point de vente': 0.20,
    'Relations presse / influence': 0.15, 'Études et suivi': 0.10,
  },
  B2B: {
    'Force de vente': 0.35, 'Marketing de contenu': 0.20, 'Salons et événements': 0.20,
    'Marketing direct / e-mailing': 0.15, 'Études et suivi': 0.10,
  },
};
// Phases : [nom, décalage début (jours), décalage fin (jours)]
const PHASES = [['Préparation', -60, -1], ['Lancement', 0, 30], ['Consolidation', 31, 90]];
const POIDS = { 'Préparation': 0.25, 'Lancement': 0.5, 'Consolidation': 0.25 };
const STATUTS = [
  { v: 'brouillon', t: 'Brouillon' }, { v: 'valide', t: 'Validé' },
  { v: 'en_cours', t: 'En cours' }, { v: 'termine', t: 'Terminé' },
];

// ---------------------------------------------------------------- Données
let db = charger();
let onglet = 'synthese';

function vide() {
  return { produits: [], plans: [], segments: [], actions: [], budgets: [], resultats: [], seq: 0 };
}
function charger() {
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (d && Array.isArray(d.produits)) return Object.assign(vide(), d);
  } catch (e) { /* données absentes ou illisibles */ }
  return vide();
}
function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(db)); }
  catch (e) { toast('Enregistrement impossible sur cet appareil'); }
}
const nid = () => ++db.seq;

// ---------------------------------------------------------------- Utilitaires
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null || isNaN(n) ? '—'
  : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
const somme = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
const statutTexte = (v) => (STATUTS.find((s) => s.v === v) || { t: v }).t;

function ajouterJours(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dateOk(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z')); }
function ratio(a, b, k) { return b ? Math.round((a / b) * (k || 1) * 100) / 100 : null; }

let minuterie;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('visible');
  clearTimeout(minuterie);
  minuterie = setTimeout(() => t.classList.remove('visible'), 2200);
}

// Boîte de dialogue de saisie. champs : {name,label,type,req,options:[{v,t}]}
function formulaire(titre, champs, vals, ok) {
  const d = document.createElement('dialog');
  const champ = (c) => {
    const val = vals[c.name] == null ? '' : vals[c.name];
    if (c.type === 'select') {
      return `<label>${esc(c.label)}<select name="${c.name}">${c.options.map((o) =>
        `<option value="${esc(o.v)}"${String(val) === String(o.v) ? ' selected' : ''}>${esc(o.t)}</option>`).join('')}</select></label>`;
    }
    const n = c.type === 'number' ? ' step="any" min="0" inputmode="decimal"' : '';
    return `<label>${esc(c.label)}<input name="${c.name}" type="${c.type || 'text'}" value="${esc(val)}"${c.req ? ' required' : ''}${n}></label>`;
  };
  d.innerHTML = `<form><h3>${esc(titre)}</h3>${champs.map(champ).join('')}
    <div class="rangee"><button type="button" class="sec" data-fermer>Annuler</button><button type="submit">Enregistrer</button></div></form>`;
  document.body.appendChild(d);
  const fermer = () => { if (d.close) { try { d.close(); } catch (e) { /* ignore */ } } d.remove(); };
  d.querySelector('[data-fermer]').onclick = fermer;
  d.querySelector('form').onsubmit = (e) => {
    e.preventDefault();
    const f = {};
    new FormData(e.target).forEach((v, k) => { f[k] = String(v).trim(); });
    if (ok(f) !== false) fermer();
  };
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}

// ---------------------------------------------------------------- Calculs
function calculerEcarts(planId) {
  const budgets = db.budgets.filter((b) => b.plan_id === planId);
  const res = db.resultats.filter((r) => r.plan_id === planId);
  const canaux = [...new Set([...budgets.map((b) => b.canal), ...res.map((r) => r.canal)])].sort();
  const lignes = canaux.map((canal) => {
    const prevu = somme(budgets.filter((b) => b.canal === canal), (b) => b.montant_prevu);
    const r = res.filter((x) => x.canal === canal);
    const depense = somme(r, (x) => x.depense_reelle);
    const prospects = somme(r, (x) => x.prospects);
    const clients = somme(r, (x) => x.clients_acquis);
    const ca = somme(r, (x) => x.chiffre_affaires);
    return {
      canal, prevu, depense, ecart: depense - prevu, prospects, clients, ca,
      conversion: ratio(clients, prospects, 100), cac: ratio(depense, clients),
      roi: ratio(ca - depense, depense, 100),
    };
  });
  const prevu = somme(lignes, (l) => l.prevu), depense = somme(lignes, (l) => l.depense);
  const ca = somme(lignes, (l) => l.ca);
  return { lignes, prevu, depense, ca, roi: ratio(ca - depense, depense, 100) };
}

function genererPlan(g) {
  const p = db.produits.find((x) => x.id === g.produit_id);
  const id = nid();
  let seuil = null;
  if (g.couts_fixes != null && p.prix_unitaire != null && p.cout_unitaire != null) {
    const marge = p.prix_unitaire - p.cout_unitaire;
    seuil = {
      marge, charges: g.couts_fixes + g.budget,
      unites: marge > 0 ? Math.round((g.couts_fixes + g.budget) / marge) : null,
    };
  }
  db.plans.push({
    id, produit_id: p.id, cible: g.cible, seuil,
    titre: g.titre || `Plan de lancement – ${p.nom}`,
    objectif: `Lancer ${p.nom} sur le marché ${g.cible} et atteindre le seuil de rentabilité`,
    positionnement: `À définir : proposition de valeur distinctive de ${p.nom} dans le secteur ${p.secteur}`,
    strategie_produit: 'Gamme, qualité, marque et conditionnement à préciser',
    strategie_prix: "Prix d'écrémage, de pénétration ou d'alignement à arbitrer",
    strategie_distribution: 'Distribution directe, en ligne ou via intermédiaires selon la cible',
    strategie_promotion: 'Mix des canaux du budget, avec calendrier en trois phases',
    date_lancement: g.date, budget_total: g.budget, statut: 'brouillon',
  });
  db.segments.push({
    id: nid(), plan_id: id,
    nom: g.cible === 'B2C' ? 'Cible principale' : 'Entreprises cibles',
    description: "Segment à qualifier (démographie, besoins, comportement d'achat)", taille_estimee: null,
  });
  const rep = REPARTITION[g.cible];
  Object.keys(rep).forEach((canal) => {
    db.budgets.push({ id: nid(), plan_id: id, canal, montant_prevu: Math.round(g.budget * rep[canal] * 100) / 100 });
  });
  Object.keys(rep).filter((c) => c !== 'Études et suivi').forEach((canal) => {
    PHASES.forEach(([phase, d1, d2]) => {
      db.actions.push({
        id: nid(), plan_id: id, phase, canal, description: `${phase} – ${canal}`,
        date_debut: ajouterJours(g.date, d1), date_fin: ajouterJours(g.date, d2),
        cout_prevu: Math.round(g.budget * rep[canal] * POIDS[phase] * 100) / 100,
      });
    });
  });
  sauver();
  return id;
}

function supprimerPlanDonnees(id) {
  ['segments', 'actions', 'budgets', 'resultats'].forEach((t) => { db[t] = db[t].filter((x) => x.plan_id !== id); });
  db.plans = db.plans.filter((p) => p.id !== id);
}

// ---------------------------------------------------------------- Vues
const optProduits = () => db.produits.map((p) => ({ v: p.id, t: p.nom }));
const nomProduit = (id) => (db.produits.find((p) => p.id === id) || { nom: '(produit supprimé)' }).nom;

function vueProduits() {
  const liste = db.produits.map((p) => `
    <div class="carte">
      <div class="ligne"><span class="titre">${esc(p.nom)}</span><span class="badge">${esc(p.secteur)}</span></div>
      ${p.description ? `<div class="doux">${esc(p.description)}</div>` : ''}
      <div class="doux">Prix : ${fmt(p.prix_unitaire)} · Coût : ${fmt(p.cout_unitaire)}</div>
      <div class="rangee">
        <button class="petit" data-act="plan-pour-produit" data-id="${p.id}">Générer un plan</button>
        <button class="petit sec" data-act="produit-modifier" data-id="${p.id}">Modifier</button>
        <button class="petit danger" data-act="produit-supprimer" data-id="${p.id}">Supprimer</button>
      </div>
    </div>`).join('');
  return `<h2>Produits</h2><button data-act="produit-ajouter">+ Nouveau produit</button><div style="height:12px"></div>
    ${liste || '<div class="vide">Aucun produit. Ajoutez le produit à lancer.</div>'}`;
}

function vuePlans() {
  const liste = db.plans.slice().reverse().map((p) => `
    <div class="carte"><a href="#/plan/${p.id}">
      <div class="ligne"><span class="titre">${esc(p.titre)}</span><span class="badge">${esc(statutTexte(p.statut))}</span></div>
      <div class="doux">${esc(nomProduit(p.produit_id))} · Lancement : ${esc(p.date_lancement || '—')}</div>
      <div class="doux">Budget : ${fmt(p.budget_total)}</div>
    </a></div>`).join('');
  return `<h2>Plans marketing</h2>
    <div class="rangee"><button data-act="plan-ajouter">+ Nouveau plan</button>
    <button class="sec" onclick="location.hash='#/generer'">Générer un plan</button></div><div style="height:12px"></div>
    ${liste || '<div class="vide">Aucun plan. Créez un produit puis générez un plan.</div>'}`;
}

function vueGenerer(produitId) {
  if (!db.produits.length) {
    return `<h2>Générer un plan</h2><div class="vide">Ajoutez d'abord un produit.<div class="rangee"><button onclick="location.hash='#/produits'">Aller aux produits</button></div></div>`;
  }
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return `<h2>Générer un plan type</h2>
    <form id="form-generer" class="carte">
      <label>Produit<select name="produit_id">${optProduits().map((o) =>
        `<option value="${o.v}"${Number(produitId) === o.v ? ' selected' : ''}>${esc(o.t)}</option>`).join('')}</select></label>
      <label>Cible<select name="cible"><option value="B2C">B2C (grand public)</option><option value="B2B">B2B (entreprises)</option></select></label>
      <label>Budget marketing total<input name="budget" type="number" step="any" min="1" inputmode="decimal" required></label>
      <label>Date de lancement<input name="date" type="date" value="${aujourdhui}" required></label>
      <label>Coûts fixes de lancement (facultatif, pour le seuil de rentabilité)<input name="couts_fixes" type="number" step="any" min="0" inputmode="decimal"></label>
      <label>Titre (facultatif)<input name="titre" type="text"></label>
      <button type="submit">Générer le plan</button>
    </form>
    <div class="doux">Répartition indicative par canal et calendrier en trois phases (préparation, lancement, consolidation), modifiables ensuite.</div>`;
}

function vueOutils() {
  return `<h2>Outils</h2>
    <div class="carte"><h3>Sauvegarde</h3>
      <div class="doux">Les données sont stockées uniquement sur ce téléphone. Exportez régulièrement une copie.</div>
      <div class="rangee"><button data-act="exporter">Exporter (JSON)</button>
      <button class="sec" data-act="importer">Importer</button></div>
      <input id="fichier" type="file" accept="application/json,.json" hidden></div>
    <div class="carte"><h3>Formules</h3>
      <div class="doux">Taux de conversion = clients acquis / prospects × 100<br>
      Coût d'acquisition = dépense réelle / clients acquis<br>
      ROI = (chiffre d'affaires − dépense) / dépense × 100<br>
      Seuil de rentabilité = (coûts fixes + budget marketing) / (prix − coût unitaire)</div></div>
    <div class="carte"><h3>Données</h3>
      <button class="danger" data-act="tout-effacer">Tout effacer</button></div>`;
}

function vuePlan(id) {
  const p = db.plans.find((x) => x.id === id);
  if (!p) return '<div class="vide">Plan introuvable.</div>';
  const onglets = [['synthese', 'Synthèse'], ['segments', 'Segments'], ['calendrier', 'Calendrier'],
    ['budget', 'Budget'], ['resultats', 'Résultats'], ['ecarts', 'Écarts']];
  const entete = `<div class="ligne"><h2>${esc(p.titre)}</h2><span class="badge">${esc(statutTexte(p.statut))}</span></div>
    <div class="doux" style="margin-bottom:8px">${esc(nomProduit(p.produit_id))}</div>
    <div class="onglets">${onglets.map(([v, t]) =>
      `<button data-act="onglet" data-v="${v}"${onglet === v ? ' class="actif"' : ''}>${t}</button>`).join('')}</div>`;
  const rendu = { synthese: ongletSynthese, segments: ongletSegments, calendrier: ongletCalendrier,
    budget: ongletBudget, resultats: ongletResultats, ecarts: ongletEcarts }[onglet];
  return `<a href="#/plans" class="doux">← Plans</a>${entete}${rendu(p)}`;
}

function ongletSynthese(p) {
  const ligne = (t, v) => `<div><span>${t}</span>${esc(v || '—')}</div>`;
  const seuil = p.seuil ? `<div class="carte"><h3>Seuil de rentabilité</h3>
      <div class="grille"><div><span>Marge unitaire</span>${fmt(p.seuil.marge)}</div>
      <div><span>Charges à couvrir</span>${fmt(p.seuil.charges)}</div>
      <div><span>Unités à vendre</span>${p.seuil.unites == null ? 'Marge nulle ou négative' : fmt(p.seuil.unites)}</div></div>
      <div class="doux">(coûts fixes + budget marketing) / marge unitaire</div></div>` : '';
  return `<div class="carte"><h3>Plan</h3><div class="grille">
      ${ligne('Objectif', p.objectif)}${ligne('Positionnement', p.positionnement)}
      ${ligne('Lancement', p.date_lancement)}${ligne('Budget total', fmt(p.budget_total))}</div></div>
    <div class="carte"><h3>Mix marketing (4P)</h3><div class="grille">
      ${ligne('Produit', p.strategie_produit)}${ligne('Prix', p.strategie_prix)}
      ${ligne('Distribution', p.strategie_distribution)}${ligne('Promotion', p.strategie_promotion)}</div></div>
    ${seuil}
    <div class="rangee"><button class="sec" data-act="plan-modifier" data-id="${p.id}">Modifier</button>
    <button class="danger" data-act="plan-supprimer" data-id="${p.id}">Supprimer</button></div>`;
}

function ongletSegments(p) {
  const l = db.segments.filter((s) => s.plan_id === p.id).map((s) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(s.nom)}</span>
      <button class="petit danger" data-act="supprimer" data-t="segments" data-id="${s.id}">Supprimer</button></div>
      <div class="doux">${esc(s.description || '')}</div>
      <div class="doux">Taille estimée : ${fmt(s.taille_estimee)}</div></div>`).join('');
  return `<button data-act="segment-ajouter">+ Segment</button><div style="height:12px"></div>${l || '<div class="vide">Aucun segment.</div>'}`;
}

function ongletCalendrier(p) {
  const l = db.actions.filter((a) => a.plan_id === p.id)
    .sort((a, b) => String(a.date_debut).localeCompare(String(b.date_debut)) || a.id - b.id).map((a) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(a.description)}</span><span class="badge">${esc(a.phase || '')}</span></div>
      <div class="doux">${esc(a.canal)} · ${esc(a.date_debut || '—')} → ${esc(a.date_fin || '—')}</div>
      <div class="ligne"><span class="doux">Coût prévu : ${fmt(a.cout_prevu)}</span>
      <button class="petit danger" data-act="supprimer" data-t="actions" data-id="${a.id}">Supprimer</button></div></div>`).join('');
  return `<button data-act="action-ajouter">+ Action</button><div style="height:12px"></div>${l || '<div class="vide">Aucune action.</div>'}`;
}

function ongletBudget(p) {
  const lignes = db.budgets.filter((b) => b.plan_id === p.id);
  const alloue = somme(lignes, (b) => b.montant_prevu);
  const reste = p.budget_total - alloue;
  const l = lignes.map((b) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(b.canal)}</span><span>${fmt(b.montant_prevu)}</span></div>
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="budgets" data-id="${b.id}">Supprimer</button></div></div>`).join('');
  return `<div class="carte"><div class="grille">
      <div><span>Budget total</span>${fmt(p.budget_total)}</div><div><span>Alloué</span>${fmt(alloue)}</div>
      <div><span>Reste à allouer</span><b class="${reste < 0 ? 'neg' : ''}">${fmt(reste)}</b></div></div></div>
    <button data-act="budget-ajouter">+ Ligne de budget</button><div style="height:12px"></div>${l || '<div class="vide">Aucune ligne.</div>'}`;
}

function ongletResultats(p) {
  const l = db.resultats.filter((r) => r.plan_id === p.id).map((r) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(r.canal)}</span><span class="doux">${esc(r.periode || '')}</span></div>
      <div class="grille"><div><span>Dépense</span>${fmt(r.depense_reelle)}</div><div><span>CA</span>${fmt(r.chiffre_affaires)}</div>
      <div><span>Prospects</span>${fmt(r.prospects)}</div><div><span>Clients</span>${fmt(r.clients_acquis)}</div></div>
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="resultats" data-id="${r.id}">Supprimer</button></div></div>`).join('');
  return `<button data-act="resultat-ajouter">+ Résultat réel</button><div style="height:12px"></div>${l || '<div class="vide">Aucun résultat saisi.</div>'}`;
}

function ongletEcarts(p) {
  const e = calculerEcarts(p.id);
  const cl = (v) => (v == null ? '' : v < 0 ? 'neg' : 'pos');
  const l = e.lignes.map((x) => `
    <div class="carte"><div class="titre">${esc(x.canal)}</div><div class="grille">
      <div><span>Budget prévu</span>${fmt(x.prevu)}</div><div><span>Dépense réelle</span>${fmt(x.depense)}</div>
      <div><span>Écart budgétaire</span>${fmt(x.ecart)}</div><div><span>Chiffre d'affaires</span>${fmt(x.ca)}</div>
      <div><span>Taux de conversion</span>${x.conversion == null ? '—' : fmt(x.conversion) + ' %'}</div>
      <div><span>Coût d'acquisition</span>${fmt(x.cac)}</div>
      <div><span>ROI</span><b class="${cl(x.roi)}">${x.roi == null ? '—' : fmt(x.roi) + ' %'}</b></div></div></div>`).join('');
  return `<div class="carte"><h3>Total du plan</h3><div class="grille">
      <div><span>Budget prévu</span>${fmt(e.prevu)}</div><div><span>Dépense réelle</span>${fmt(e.depense)}</div>
      <div><span>Chiffre d'affaires</span>${fmt(e.ca)}</div>
      <div><span>ROI global</span><b class="${cl(e.roi)}">${e.roi == null ? '—' : fmt(e.roi) + ' %'}</b></div></div></div>
    ${l || '<div class="vide">Ajoutez un budget et des résultats pour voir les écarts.</div>'}`;
}

// ---------------------------------------------------------------- Actions
const planId = () => Number((location.hash.match(/^#\/plan\/(\d+)/) || [])[1] || 0);

const ACTIONS = {
  onglet: (d) => { onglet = d.v; afficher(); },

  'produit-ajouter': () => produitForm(null),
  'produit-modifier': (d) => produitForm(Number(d.id)),
  'produit-supprimer': (d) => {
    const n = db.plans.filter((p) => p.produit_id === Number(d.id)).length;
    if (!confirm(n ? `Supprimer ce produit et ses ${n} plan(s) ?` : 'Supprimer ce produit ?')) return;
    db.plans.filter((p) => p.produit_id === Number(d.id)).forEach((p) => supprimerPlanDonnees(p.id));
    db.produits = db.produits.filter((p) => p.id !== Number(d.id));
    sauver(); afficher();
  },
  'plan-pour-produit': (d) => { location.hash = '#/generer/' + d.id; },

  'plan-ajouter': () => {
    if (!db.produits.length) { toast("Ajoutez d'abord un produit"); location.hash = '#/produits'; return; }
    planForm(null);
  },
  'plan-modifier': (d) => planForm(Number(d.id)),
  'plan-supprimer': (d) => {
    if (!confirm('Supprimer ce plan et toutes ses données ?')) return;
    supprimerPlanDonnees(Number(d.id)); sauver(); location.hash = '#/plans';
  },

  'segment-ajouter': () => formulaire('Nouveau segment', [
    { name: 'nom', label: 'Nom', req: true }, { name: 'description', label: 'Description' },
    { name: 'taille', label: 'Taille estimée', type: 'number' }], {}, (f) => {
    db.segments.push({ id: nid(), plan_id: planId(), nom: f.nom, description: f.description, taille_estimee: num(f.taille) });
    sauver(); afficher();
  }),
  'action-ajouter': () => formulaire('Nouvelle action', [
    { name: 'phase', label: 'Phase', type: 'select', options: PHASES.map((x) => ({ v: x[0], t: x[0] })) },
    { name: 'canal', label: 'Canal', req: true }, { name: 'description', label: 'Description', req: true },
    { name: 'debut', label: 'Début', type: 'date' }, { name: 'fin', label: 'Fin', type: 'date' },
    { name: 'cout', label: 'Coût prévu', type: 'number' }], {}, (f) => {
    db.actions.push({ id: nid(), plan_id: planId(), phase: f.phase, canal: f.canal, description: f.description,
      date_debut: f.debut || null, date_fin: f.fin || null, cout_prevu: num(f.cout) || 0 });
    sauver(); afficher();
  }),
  'budget-ajouter': () => formulaire('Ligne de budget', [
    { name: 'canal', label: 'Canal', req: true }, { name: 'montant', label: 'Montant prévu', type: 'number', req: true }], {}, (f) => {
    db.budgets.push({ id: nid(), plan_id: planId(), canal: f.canal, montant_prevu: num(f.montant) || 0 });
    sauver(); afficher();
  }),
  'resultat-ajouter': () => {
    const canaux = [...new Set(db.budgets.filter((b) => b.plan_id === planId()).map((b) => b.canal))];
    formulaire('Résultat réel', [
      canaux.length ? { name: 'canal', label: 'Canal', type: 'select', options: canaux.map((c) => ({ v: c, t: c })) }
        : { name: 'canal', label: 'Canal', req: true },
      { name: 'depense', label: 'Dépense réelle', type: 'number' }, { name: 'prospects', label: 'Prospects', type: 'number' },
      { name: 'clients', label: 'Clients acquis', type: 'number' }, { name: 'ca', label: "Chiffre d'affaires", type: 'number' },
      { name: 'periode', label: 'Période (ex. 2027-01)' }], {}, (f) => {
      db.resultats.push({ id: nid(), plan_id: planId(), canal: f.canal, depense_reelle: num(f.depense) || 0,
        prospects: num(f.prospects) || 0, clients_acquis: num(f.clients) || 0, chiffre_affaires: num(f.ca) || 0, periode: f.periode });
      sauver(); afficher();
    });
  },
  supprimer: (d) => {
    if (!confirm('Supprimer cet élément ?')) return;
    db[d.t] = db[d.t].filter((x) => x.id !== Number(d.id));
    sauver(); afficher();
  },

  exporter: () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plan-marketing-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée');
  },
  importer: () => $('#fichier').click(),
  'tout-effacer': () => {
    if (!confirm('Effacer toutes les données de cet appareil ?')) return;
    db = vide(); sauver(); location.hash = '#/plans'; afficher();
  },
};

function produitForm(id) {
  const p = id ? db.produits.find((x) => x.id === id) : {};
  formulaire(id ? 'Modifier le produit' : 'Nouveau produit', [
    { name: 'nom', label: 'Nom', req: true },
    { name: 'secteur', label: 'Secteur (ex. cosmétique, agroalimentaire)', req: true },
    { name: 'description', label: 'Description' },
    { name: 'prix', label: 'Prix unitaire', type: 'number' }, { name: 'cout', label: 'Coût unitaire', type: 'number' },
  ], { nom: p.nom, secteur: p.secteur, description: p.description, prix: p.prix_unitaire, cout: p.cout_unitaire }, (f) => {
    const o = { nom: f.nom, secteur: f.secteur, description: f.description, prix_unitaire: num(f.prix), cout_unitaire: num(f.cout) };
    if (id) Object.assign(p, o); else db.produits.push(Object.assign({ id: nid() }, o));
    sauver(); afficher();
  });
}

function planForm(id) {
  const p = id ? db.plans.find((x) => x.id === id) : {};
  formulaire(id ? 'Modifier le plan' : 'Nouveau plan', [
    { name: 'produit_id', label: 'Produit', type: 'select', options: optProduits() },
    { name: 'titre', label: 'Titre', req: true }, { name: 'objectif', label: 'Objectif' },
    { name: 'positionnement', label: 'Positionnement' }, { name: 'strategie_produit', label: 'Produit (4P)' },
    { name: 'strategie_prix', label: 'Prix (4P)' }, { name: 'strategie_distribution', label: 'Distribution (4P)' },
    { name: 'strategie_promotion', label: 'Promotion (4P)' },
    { name: 'date_lancement', label: 'Date de lancement', type: 'date' },
    { name: 'budget_total', label: 'Budget total', type: 'number' },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS },
  ], Object.assign({ statut: 'brouillon' }, p), (f) => {
    const o = Object.assign({}, f, { produit_id: Number(f.produit_id), budget_total: num(f.budget_total) || 0, date_lancement: f.date_lancement || null });
    if (id) Object.assign(p, o);
    else { id = nid(); db.plans.push(Object.assign({ id }, o)); }
    sauver(); location.hash = '#/plan/' + id; afficher();
  });
}

// ---------------------------------------------------------------- Routage et affichage
function afficher() {
  const [vue, arg] = (location.hash.replace(/^#\/?/, '') || 'plans').split('/');
  const html = {
    plans: vuePlans, produits: vueProduits, generer: () => vueGenerer(arg),
    outils: vueOutils, plan: () => vuePlan(Number(arg)),
  }[vue] || vuePlans;
  $('#app').innerHTML = html();
  const actif = vue === 'plan' ? 'plans' : vue;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('actif', a.dataset.vue === actif));
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el.dataset);
});

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'form-generer') return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target).entries());
  const budget = num(f.budget);
  if (!budget || budget <= 0) { toast('Budget invalide'); return; }
  if (!dateOk(f.date)) { toast('Date de lancement invalide'); return; }
  const id = genererPlan({
    produit_id: Number(f.produit_id), cible: f.cible, budget, date: f.date,
    couts_fixes: num(f.couts_fixes), titre: (f.titre || '').trim(),
  });
  onglet = 'synthese';
  toast('Plan généré (brouillon)');
  location.hash = '#/plan/' + id;
});

document.addEventListener('change', (e) => {
  if (e.target.id !== 'fichier' || !e.target.files[0]) return;
  const lecteur = new FileReader();
  lecteur.onload = () => {
    try {
      const d = JSON.parse(lecteur.result);
      if (!d || !Array.isArray(d.produits) || !Array.isArray(d.plans)) throw new Error('format');
      if (!confirm('Remplacer les données actuelles par cette sauvegarde ?')) return;
      db = Object.assign(vide(), d); sauver(); location.hash = '#/plans'; afficher(); toast('Sauvegarde importée');
    } catch (err) { toast('Fichier de sauvegarde invalide'); }
  };
  lecteur.readAsText(e.target.files[0]);
});

window.addEventListener('hashchange', () => { onglet = 'synthese'; afficher(); });
afficher();

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne non disponible */ });
}
