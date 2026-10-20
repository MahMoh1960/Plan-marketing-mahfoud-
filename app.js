'use strict';
/* Plan marketing – lancement de nouveaux produits
   Application autonome : les données sont conservées sur l'appareil (localStorage).
   Un plan suit six rubriques : résumé managérial, audit, stratégie, marketing mix,
   plan d'action et budget, pilotage et contrôle. */

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

const RUBRIQUES = [
  ['r1', 'Résumé managérial', 'Résumé'],
  ['r2', 'Audit marketing et diagnostic stratégique', 'Audit'],
  ['r3', 'Objectifs et stratégie marketing', 'Stratégie'],
  ['r4', 'Marketing opérationnel (marketing mix)', 'Mix'],
  ['r5', "Plan d'action, calendrier et budget", 'Action'],
  ['r6', 'Pilotage, suivi et contrôle', 'Pilotage'],
];
const CIBLAGES = [
  { v: '', t: '— À choisir —' }, { v: 'indifferencie', t: 'Indifférencié' },
  { v: 'differencie', t: 'Différencié' }, { v: 'concentre', t: 'Concentré (niche)' },
  { v: 'personnalise', t: 'Personnalisé' },
];
const CRITERES = [
  { v: '', t: '— Critère —' }, { v: 'sociodemographique', t: 'Socio-démographique' },
  { v: 'psychographique', t: 'Psychographique' }, { v: 'comportemental', t: 'Comportemental' },
];
const TYPES_OBJ = [{ v: 'quantitatif', t: 'Quantitatif' }, { v: 'qualitatif', t: 'Qualitatif' }];

// Textes produits par les anciennes versions : ils sont retirés à la migration (champs laissés vides).
const STUB_SEGMENT = "Segment à qualifier (démographie, besoins, comportement d'achat)";
const ANCIENS_TEXTES = {
  strategie_produit: ['produit', 'Gamme, qualité, marque et conditionnement à préciser'],
  strategie_prix: ['prix', "Prix d'écrémage, de pénétration ou d'alignement à arbitrer"],
  strategie_distribution: ['distribution', 'Distribution directe, en ligne ou via intermédiaires selon la cible'],
  strategie_promotion: ['communication', 'Mix des canaux du budget, avec calendrier en trois phases'],
};

const AIDES = {
  r1: `Placé en ouverture du document mais rédigé en dernier, le résumé présente en une à deux pages la quintessence du plan à destination de la direction : principaux constats de l'audit, objectifs phares, axe stratégique retenu et enveloppe budgétaire globale. Ici, il est composé automatiquement à partir des autres rubriques.`,
  r2: `Analyse de l'environnement pour identifier les marges de manœuvre : macro-environnement (PESTEL : facteurs politiques, économiques, socioculturels, technologiques, écologiques et légaux), micro-environnement (taille du marché, tendances, comportement d'achat, concurrence, 5 forces de Porter) et analyse interne (performances passées, portefeuille d'activités, notoriété, capacités). La synthèse SWOT croise forces et faiblesses internes avec opportunités et menaces externes, pour dégager les facteurs clés de succès.`,
  r3: `À partir du diagnostic, l'entreprise fixe son cap. Objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes et Temporellement définis, quantitatifs (ventes, chiffre d'affaires, part de marché, marge, rétention) ou qualitatifs (notoriété, image, satisfaction, NPS). Démarche SCP : segmentation (sous-groupes homogènes), ciblage (stratégie indifférenciée, différenciée, concentrée ou personnalisée, avec buyer personas) et positionnement (place distinctive, crédible et durable, formulée en proposition de valeur unique).`,
  r4: `Traduction concrète du positionnement à travers les 4P pour les biens (Produit, Prix, Distribution, Communication), ou les 7P pour les services, qui ajoutent le Personnel, les Processus et la Preuve matérielle.`,
  r5: `Une stratégie n'a de valeur que par son exécution chiffrée et planifiée : plan d'action et rétroplanning (qui fait quoi, quand, avec quels moyens), budget marketing et compte d'exploitation prévisionnel. Contribution marketing nette = marge brute − frais marketing directs.`,
  r6: `Mécanismes de gouvernance pour vérifier l'efficacité du plan : indicateurs clés (CAC, LTV, ROMI, taux de conversion, parts de voix) et plan de contingence (scénarios alternatifs si les hypothèses de marché s'écartent des prévisions). Formules utilisées ici : CAC = dépense réelle / clients acquis ; LTV = marge moyenne par client et par an × durée de la relation (en années) ; ROMI = contribution marketing nette / frais marketing × 100, avec marge brute = chiffre d'affaires × taux de marge du produit. La part de voix (part de vos dépenses de communication dans celles du marché) est saisie à la main.`,
};

// Groupes de champs modifiables par formulaire : titre, objet modifié, champs.
const T = 'textarea';
const GROUPES = {
  pestel: {
    titre: 'Macro-environnement (PESTEL)', obj: (p) => p.audit.pestel, champs: [
      { name: 'politique', label: 'Politique', type: T, ph: 'Réglementation, stabilité, politiques publiques…' },
      { name: 'economique', label: 'Économique', type: T, ph: "Conjoncture, pouvoir d'achat, inflation…" },
      { name: 'socioculturel', label: 'Socioculturel', type: T, ph: 'Modes de vie, valeurs, démographie…' },
      { name: 'technologique', label: 'Technologique', type: T, ph: 'Innovations, digitalisation…' },
      { name: 'ecologique', label: 'Écologique', type: T, ph: 'Environnement, durabilité…' },
      { name: 'legal', label: 'Légal', type: T, ph: 'Normes, droit de la consommation…' }],
  },
  marche: {
    titre: 'Marché et concurrence', obj: (p) => p.audit.marche, champs: [
      { name: 'taille', label: 'Taille du marché (volume et valeur)', type: T },
      { name: 'tendances', label: 'Tendances de consommation', type: T },
      { name: 'comportement', label: "Comportement d'achat des clients", type: T },
      { name: 'concurrence', label: 'Concurrence et groupes stratégiques', type: T }],
  },
  forces: {
    titre: 'Les 5 forces de Porter', obj: (p) => p.audit.forces, champs: [
      { name: 'entrants', label: 'Menace des nouveaux entrants', type: T },
      { name: 'substituts', label: 'Menace des produits de substitution', type: T },
      { name: 'clients', label: 'Pouvoir de négociation des clients', type: T },
      { name: 'fournisseurs', label: 'Pouvoir de négociation des fournisseurs', type: T },
      { name: 'rivalite', label: 'Intensité de la rivalité concurrentielle', type: T }],
  },
  interne: {
    titre: 'Analyse interne', obj: (p) => p.audit.interne, champs: [
      { name: 'performances', label: 'Performances passées', type: T },
      { name: 'portefeuille', label: "Portefeuille d'activités (matrices BCG ou McKinsey)", type: T },
      { name: 'notoriete', label: 'Notoriété et capital marque', type: T },
      { name: 'capacites', label: 'Capacités opérationnelles', type: T }],
  },
  swot: {
    titre: 'Synthèse SWOT (FFOM)', obj: (p) => p.audit.swot, champs: [
      { name: 'forces', label: 'Forces (internes) — un élément par ligne', type: T },
      { name: 'faiblesses', label: 'Faiblesses (internes) — un élément par ligne', type: T },
      { name: 'opportunites', label: 'Opportunités (externes) — un élément par ligne', type: T },
      { name: 'menaces', label: 'Menaces (externes) — un élément par ligne', type: T }],
  },
  fcs: {
    titre: 'Facteurs clés de succès', obj: (p) => p.audit, champs: [
      { name: 'fcs', label: 'Facteurs clés de succès — un par ligne', type: T }],
  },
  strategie: {
    titre: 'Ciblage et positionnement', obj: (p) => p, champs: [
      { name: 'ciblage', label: 'Stratégie de ciblage', type: 'select', options: CIBLAGES },
      { name: 'positionnement', label: 'Positionnement', type: T, ph: "Place distinctive, crédible et durable dans l'esprit des clients ciblés" },
      { name: 'proposition_valeur', label: 'Proposition de valeur unique', type: T }],
  },
  mix4: {
    titre: 'Les 4P', obj: (p) => p.mix, champs: [
      { name: 'produit', label: 'Produit', type: T, ph: 'Gamme, design, packaging, marque, garanties, cycle de vie…' },
      { name: 'prix', label: 'Prix', type: T, ph: 'Écrémage, pénétration, alignement ; remises ; conditions de paiement…' },
      { name: 'distribution', label: 'Distribution', type: T, ph: 'Canaux, couverture, merchandising, logistique…' },
      { name: 'communication', label: 'Communication', type: T, ph: 'Pull ou push, mix média, digital, relations publiques, force de vente…' }],
  },
  mix3: {
    titre: 'Les 3P supplémentaires (services)', obj: (p) => p.mix, champs: [
      { name: 'personnel', label: 'Personnel (People)', type: T },
      { name: 'processus', label: 'Processus (Process)', type: T },
      { name: 'preuve', label: 'Preuve matérielle (Physical Evidence)', type: T }],
  },
  ventes: {
    titre: 'Ventes prévisionnelles', obj: (p) => p, champs: [
      { name: 'ventes_prevues', label: 'Ventes prévues sur la période (unités)', type: 'number' }],
  },
  ltv: {
    titre: 'Valeur vie client (LTV)', obj: (p) => p.ltv, champs: [
      { name: 'marge', label: 'Marge moyenne par client et par an', type: 'number' },
      { name: 'duree', label: 'Durée moyenne de la relation (en années)', type: 'number' }],
  },
  pv: {
    titre: 'Part de voix', obj: (p) => p, champs: [
      { name: 'part_de_voix', label: 'Part de voix (%) — saisie', type: 'number' }],
  },
};

// ---------------------------------------------------------------- Données
let db = charger();
let onglet = 'r1';
let aideOuverte = false;
let prochainOnglet = null;

function vide() {
  return {
    produits: [], plans: [], segments: [], actions: [], budgets: [], resultats: [],
    objectifs: [], personas: [], contingences: [], seq: 0,
  };
}
function charger() {
  try {
    const d = JSON.parse(localStorage.getItem(CLE));
    if (d && Array.isArray(d.produits)) { const x = Object.assign(vide(), d); migrer(x); return x; }
  } catch (e) { /* données absentes ou illisibles */ }
  return vide();
}
function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(db)); }
  catch (e) { toast('Enregistrement impossible sur cet appareil'); }
}
const nid = () => ++db.seq;
// Vrai lorsque l'application s'exécute dans l'APK (Capacitor) et non dans un navigateur
const estNatif = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function'
  && window.Capacitor.isNativePlatform());

function planDefaut() {
  return {
    objectif: '', date_lancement: null, budget_total: 0, statut: 'brouillon', cible: null, seuil: null,
    audit: { pestel: {}, marche: {}, forces: {}, interne: {}, swot: {}, fcs: '' },
    ciblage: '', positionnement: '', proposition_valeur: '',
    mode_mix: '4P', mix: {}, ventes_prevues: null, ltv: { marge: null, duree: null }, part_de_voix: null,
  };
}
// Complète un plan ancien ou incomplet ; retire les textes d'exemple des anciennes versions.
function normaliserPlan(p) {
  const d = planDefaut();
  Object.keys(d).forEach((k) => { if (p[k] === undefined) p[k] = d[k]; });
  p.audit = p.audit || {};
  ['pestel', 'marche', 'forces', 'interne'].forEach((k) => { p.audit[k] = p.audit[k] || {}; });
  p.audit.swot = Object.assign({ forces: '', faiblesses: '', opportunites: '', menaces: '' }, p.audit.swot);
  if (p.audit.fcs == null) p.audit.fcs = '';
  p.mix = p.mix || {};
  p.ltv = Object.assign({ marge: null, duree: null }, p.ltv);
  Object.keys(ANCIENS_TEXTES).forEach((k) => {
    if (!(k in p)) return;
    const [cle, exemple] = ANCIENS_TEXTES[k];
    if (p[k] && p[k] !== exemple && !p.mix[cle]) p.mix[cle] = p[k];
    delete p[k];
  });
  if (typeof p.positionnement === 'string' && p.positionnement.indexOf('À définir') === 0) p.positionnement = '';
}
function migrer(d) {
  d.plans.forEach(normaliserPlan);
  // Segments d'exemple créés automatiquement par les anciennes versions et jamais modifiés
  d.segments = d.segments.filter((s) => !(s.description === STUB_SEGMENT && s.taille_estimee == null
    && (s.nom === 'Cible principale' || s.nom === 'Entreprises cibles')));
  d.segments.forEach((s) => { if (s.critere === undefined) s.critere = ''; });
}

// ---------------------------------------------------------------- Utilitaires
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null || isNaN(n) ? '—'
  : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
const somme = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
const txt = (v) => String(v == null ? '' : v).trim() !== '';
const lignesDe = (t) => String(t == null ? '' : t).split('\n').map((x) => x.trim()).filter(Boolean);
const libelle = (liste, v) => (liste.find((o) => o.v === v) || { t: v }).t;
const statutTexte = (v) => libelle(STATUTS, v);

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

async function copierTexte(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(t); return true; }
  } catch (e) { /* repli ci-dessous */ }
  try {
    const a = document.createElement('textarea');
    a.value = t; a.style.position = 'fixed'; a.style.opacity = '0';
    document.body.appendChild(a); a.select();
    const ok = document.execCommand && document.execCommand('copy');
    a.remove();
    return !!ok;
  } catch (e) { return false; }
}

// Boîte de dialogue de saisie. champs : {name,label,type,req,ph,options:[{v,t}]}
function formulaire(titre, champs, vals, ok) {
  const d = document.createElement('dialog');
  const champ = (c) => {
    const val = vals[c.name] == null ? '' : vals[c.name];
    const ph = c.ph ? ` placeholder="${esc(c.ph)}"` : '';
    if (c.type === 'select') {
      return `<label>${esc(c.label)}<select name="${c.name}">${c.options.map((o) =>
        `<option value="${esc(o.v)}"${String(val) === String(o.v) ? ' selected' : ''}>${esc(o.t)}</option>`).join('')}</select></label>`;
    }
    if (c.type === 'textarea') {
      return `<label>${esc(c.label)}<textarea name="${c.name}" rows="3"${ph}>${esc(val)}</textarea></label>`;
    }
    const n = c.type === 'number' ? ' step="any" min="0" inputmode="decimal"' : '';
    return `<label>${esc(c.label)}<input name="${c.name}" type="${c.type || 'text'}" value="${esc(val)}"${ph}${c.req ? ' required' : ''}${n}></label>`;
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
const produitDe = (p) => db.produits.find((x) => x.id === p.produit_id) || null;

// Taux de marge = (prix − coût) / prix ; nul si prix ou coût manquants
function tauxMarge(prod) {
  return prod && prod.prix_unitaire > 0 && prod.cout_unitaire != null
    ? (prod.prix_unitaire - prod.cout_unitaire) / prod.prix_unitaire : null;
}
// Frais marketing directs prévus : somme des lignes de budget, à défaut le budget total
function fraisMarketing(p) {
  const s = somme(db.budgets.filter((b) => b.plan_id === p.id), (b) => b.montant_prevu);
  return s > 0 ? s : (p.budget_total || 0);
}
// Compte d'exploitation prévisionnel : contribution marketing nette = marge brute − frais marketing directs
function compteExploitation(p) {
  const prod = produitDe(p);
  if (!prod || p.ventes_prevues == null || prod.prix_unitaire == null || prod.cout_unitaire == null) return null;
  const ca = p.ventes_prevues * prod.prix_unitaire;
  const cv = p.ventes_prevues * prod.cout_unitaire;
  const marge = ca - cv;
  const frais = fraisMarketing(p);
  const contribution = marge - frais;
  return { ca, cv, marge, frais, contribution, romi: ratio(contribution, frais, 100) };
}
// Valeur vie client = marge moyenne par client et par an × durée moyenne de la relation (en années)
function calculerLtv(p) {
  return p.ltv.marge != null && p.ltv.duree != null ? p.ltv.marge * p.ltv.duree : null;
}
// Écarts prévu/réalisé et indicateurs (conversion, CAC, ROMI) par canal et au total.
// ROMI = contribution marketing nette / frais marketing × 100, marge brute = CA × taux de marge du produit.
function calculerEcarts(p) {
  const tm = tauxMarge(produitDe(p));
  const budgets = db.budgets.filter((b) => b.plan_id === p.id);
  const res = db.resultats.filter((r) => r.plan_id === p.id);
  const canaux = [...new Set([...budgets.map((b) => b.canal), ...res.map((r) => r.canal)])].sort();
  const mesure = (prevu, r) => {
    const depense = somme(r, (x) => x.depense_reelle);
    const prospects = somme(r, (x) => x.prospects);
    const clients = somme(r, (x) => x.clients_acquis);
    const ca = somme(r, (x) => x.chiffre_affaires);
    const contribution = tm == null ? null : ca * tm - depense;
    return {
      prevu, depense, ecart: depense - prevu, prospects, clients, ca, contribution,
      conversion: ratio(clients, prospects, 100), cac: ratio(depense, clients),
      romi: contribution == null ? null : ratio(contribution, depense, 100),
    };
  };
  const lignes = canaux.map((canal) => Object.assign({ canal },
    mesure(somme(budgets.filter((b) => b.canal === canal), (b) => b.montant_prevu), res.filter((x) => x.canal === canal))));
  return { lignes, total: mesure(somme(lignes, (l) => l.prevu), res), tm };
}

// Progression par rubrique : critères remplis / critères attendus
function avancement(p) {
  const A = p.audit, M = p.mix;
  const plein = (o) => !!o && Object.keys(o).some((k) => txt(o[k]));
  const compte = (t) => db[t].filter((x) => x.plan_id === p.id).length;
  const r = {};
  r.r2 = [plein(A.pestel), plein(A.marche) || plein(A.forces), plein(A.interne),
    ['forces', 'faiblesses', 'opportunites', 'menaces'].every((k) => lignesDe(A.swot[k]).length > 0)];
  r.r3 = [compte('objectifs') > 0, compte('segments') > 0, txt(p.ciblage),
    txt(p.positionnement) && txt(p.proposition_valeur)];
  const cles = ['produit', 'prix', 'distribution', 'communication']
    .concat(p.mode_mix === '7P' ? ['personnel', 'processus', 'preuve'] : []);
  r.r4 = cles.map((k) => txt(M[k]));
  r.r5 = [compte('actions') > 0, compte('budgets') > 0, p.ventes_prevues != null];
  r.r6 = [compte('resultats') > 0, p.ltv.marge != null && p.ltv.duree != null, compte('contingences') > 0];
  const fini = (k) => r[k].every(Boolean);
  r.r1 = [fini('r2'), fini('r3'), fini('r5')];
  const out = {};
  Object.keys(r).forEach((k) => { out[k] = { done: r[k].filter(Boolean).length, total: r[k].length }; });
  return out;
}

// Résumé managérial composé à partir des autres rubriques
function composerResume(p) {
  const A = p.audit;
  const S = [];
  const audit = [];
  [['forces', 'Forces'], ['faiblesses', 'Faiblesses'], ['opportunites', 'Opportunités'], ['menaces', 'Menaces']]
    .forEach(([k, t]) => {
      const l = lignesDe(A.swot[k]);
      if (l.length) audit.push(`${t} : ${l.slice(0, 3).join(' ; ')}${l.length > 3 ? ' …' : ''}`);
    });
  const fcs = lignesDe(A.fcs);
  if (fcs.length) audit.push(`Facteurs clés de succès : ${fcs.join(' ; ')}`);
  S.push({ titre: "Principaux constats de l'audit", lignes: audit, rubrique: 'r2' });

  const objs = db.objectifs.filter((o) => o.plan_id === p.id).map((o) =>
    `${o.intitule}${o.indicateur ? ' — ' + o.indicateur : ''}${o.valeur_cible ? ' : ' + o.valeur_cible : ''}`
    + `${o.echeance ? ' (échéance : ' + o.echeance + ')' : ''}`);
  S.push({ titre: 'Objectifs phares', lignes: objs, rubrique: 'r3' });

  const axe = [];
  if (p.ciblage) axe.push('Stratégie de ciblage : ' + libelle(CIBLAGES, p.ciblage));
  const segs = db.segments.filter((s) => s.plan_id === p.id).map((s) => s.nom);
  if (segs.length) axe.push('Segments visés : ' + segs.join(', '));
  if (txt(p.positionnement)) axe.push('Positionnement : ' + p.positionnement);
  if (txt(p.proposition_valeur)) axe.push('Proposition de valeur : ' + p.proposition_valeur);
  S.push({ titre: 'Axe stratégique retenu', lignes: axe, rubrique: 'r3' });

  const bud = [];
  if (p.budget_total > 0) {
    bud.push('Budget marketing global : ' + fmt(p.budget_total));
    if (p.date_lancement) bud.push('Lancement prévu : ' + p.date_lancement);
    const c = compteExploitation(p);
    if (c) {
      bud.push(`Contribution marketing nette prévisionnelle : ${fmt(c.contribution)}`
        + `${c.romi == null ? '' : ' (ROMI : ' + fmt(c.romi) + ' %)'}`);
    }
  }
  S.push({ titre: 'Enveloppe budgétaire globale', lignes: bud, rubrique: 'r5' });
  return S;
}
function texteResume(p) {
  const prod = produitDe(p);
  const tete = `${p.titre}${prod ? ' — ' + prod.nom : ''}\nRésumé managérial\n`;
  return tete + composerResume(p).map((s) =>
    `\n${s.titre}\n${s.lignes.length ? s.lignes.map((l) => '- ' + l).join('\n') : '- (à compléter)'}`).join('\n');
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
  // Seule la structure est créée : les rubriques (audit, stratégie, mix…) restent à compléter.
  const plan = Object.assign(planDefaut(), {
    id, produit_id: p.id, cible: g.cible, seuil,
    titre: g.titre || `Plan de lancement – ${p.nom}`,
    objectif: `Lancer ${p.nom} sur le marché ${g.cible} et atteindre le seuil de rentabilité`,
    date_lancement: g.date, budget_total: g.budget,
  });
  normaliserPlan(plan);
  db.plans.push(plan);
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
  ['segments', 'actions', 'budgets', 'resultats', 'objectifs', 'personas', 'contingences']
    .forEach((t) => { db[t] = db[t].filter((x) => x.plan_id !== id); });
  db.plans = db.plans.filter((p) => p.id !== id);
}

// ---------------------------------------------------------------- Vues : produits, plans, génération, outils
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
    <div class="doux">Sont créés : le budget réparti par canal (répartition indicative) et le calendrier en trois phases. Les six rubriques du plan (audit, stratégie, mix…) restent à compléter.</div>`;
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
      Coût d'acquisition client (CAC) = dépense réelle / clients acquis<br>
      Contribution marketing nette = marge brute − frais marketing directs<br>
      ROMI = contribution marketing nette / frais marketing × 100<br>
      Valeur vie client (LTV) = marge moyenne par client et par an × durée de la relation (années)<br>
      Seuil de rentabilité = (coûts fixes + budget marketing) / (prix − coût unitaire)</div></div>
    <div class="carte"><h3>Données</h3>
      <button class="danger" data-act="tout-effacer">Tout effacer</button></div>`;
}

// ---------------------------------------------------------------- Vue d'un plan : six rubriques
function vuePlan(id) {
  const p = db.plans.find((x) => x.id === id);
  if (!p) return '<div class="vide">Plan introuvable.</div>';
  const av = avancement(p);
  const etapes = RUBRIQUES.map(([v, , court], i) => {
    const a = av[v], fait = a.done === a.total;
    return `<button data-act="onglet" data-v="${v}" class="${onglet === v ? 'actif' : ''}${fait ? ' fait' : ''}">`
      + `<b>${fait ? '✓' : i + 1}</b><span>${court}</span>${fait ? '' : `<small>${a.done}/${a.total}</small>`}</button>`;
  }).join('');
  const idx = RUBRIQUES.findIndex((r) => r[0] === onglet);
  const [cle, titre] = RUBRIQUES[idx < 0 ? 0 : idx];
  const rendu = { r1: rubrique1, r2: rubrique2, r3: rubrique3, r4: rubrique4, r5: rubrique5, r6: rubrique6 }[cle];
  return `<a href="#/plans" class="doux">← Plans</a>
    <div class="ligne"><h2>${esc(p.titre)}</h2></div>
    <div class="doux" style="margin-bottom:8px">${esc(nomProduit(p.produit_id))}</div>
    <div class="etapes">${etapes}</div>
    <div class="ligne"><h2>${(idx < 0 ? 0 : idx) + 1}. ${esc(titre)}</h2>
      <button class="petit sec" data-act="aide" aria-label="Aide">?</button></div>
    ${aideOuverte ? `<div class="carte aide">${esc(AIDES[cle])}</div>` : ''}
    ${rendu(p)}`;
}

function section(titre, bouton) {
  return `<div class="ligne sect"><h3>${esc(titre)}</h3>${bouton || ''}</div>`;
}
function listeCartes(items, rendu, texteVide) {
  return items.length ? items.map(rendu).join('') : `<div class="vide">${texteVide}</div>`;
}
const affiche = (c, v) => (c.type === 'select' ? libelle(c.options, v) : c.type === 'number' ? fmt(v) : String(v));

// Carte d'un groupe de champs (valeurs renseignées + bouton de saisie)
function carteGroupe(id, p) {
  const g = GROUPES[id], obj = g.obj(p);
  const corps = g.champs.filter((c) => txt(obj[c.name])).map((c) =>
    `<div class="champ"><span class="doux">${esc(c.label.replace(/ — .*$/, ''))}</span><div class="pre">${esc(affiche(c, obj[c.name]))}</div></div>`).join('');
  return `<div class="carte"><div class="ligne"><h3>${esc(g.titre)}</h3>
    <button class="petit sec" data-act="editer-groupe" data-g="${id}">${corps ? 'Modifier' : 'Renseigner'}</button></div>
    ${corps || '<div class="doux">Non renseigné.</div>'}</div>`;
}

// Rubrique 1 : résumé managérial
function rubrique1(p) {
  const prod = produitDe(p);
  const info = `<div class="carte"><div class="ligne"><h3>Informations générales</h3><span class="badge">${esc(statutTexte(p.statut))}</span></div>
    <div class="grille"><div><span>Produit</span>${esc(prod ? prod.nom : '—')}</div><div><span>Lancement</span>${esc(p.date_lancement || '—')}</div>
    <div><span>Budget total</span>${fmt(p.budget_total)}</div><div><span>Cible</span>${esc(p.cible || '—')}</div></div>
    ${p.objectif ? `<div class="doux" style="margin-top:8px">${esc(p.objectif)}</div>` : ''}
    <div class="rangee"><button class="sec petit" data-act="plan-modifier" data-id="${p.id}">Modifier</button>
    <button class="danger petit" data-act="plan-supprimer" data-id="${p.id}">Supprimer</button></div></div>`;
  const cartes = composerResume(p).map((s) => `<div class="carte"><h3>${esc(s.titre)}</h3>${s.lignes.length
    ? s.lignes.map((l) => `<div class="pre">${esc(l)}</div>`).join('')
    : `<div class="doux">À compléter dans la rubrique ${s.rubrique.slice(1)}.</div>
       <div class="rangee"><button class="petit sec" data-act="onglet" data-v="${s.rubrique}">Ouvrir la rubrique ${s.rubrique.slice(1)}</button></div>`}</div>`).join('');
  return `${info}${section('Résumé composé automatiquement')}${cartes}
    <button data-act="copier-resume">Copier le résumé</button>`;
}

// Rubrique 2 : audit
function rubrique2(p) {
  const s = p.audit.swot;
  const cellule = (cle, titre) => {
    const l = lignesDe(s[cle]);
    return `<div class="cellule"><div class="titre">${titre}</div>${l.length
      ? `<ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<div class="doux">—</div>'}</div>`;
  };
  const videSwot = !['forces', 'faiblesses', 'opportunites', 'menaces'].some((k) => lignesDe(s[k]).length);
  const swot = `<div class="carte"><div class="ligne"><h3>Synthèse SWOT (FFOM)</h3>
    <button class="petit sec" data-act="editer-groupe" data-g="swot">${videSwot ? 'Renseigner' : 'Modifier'}</button></div>
    <div class="swot">${cellule('forces', 'Forces')}${cellule('faiblesses', 'Faiblesses')}
    ${cellule('opportunites', 'Opportunités')}${cellule('menaces', 'Menaces')}</div></div>`;
  return carteGroupe('pestel', p) + carteGroupe('marche', p) + carteGroupe('forces', p)
    + carteGroupe('interne', p) + swot + carteGroupe('fcs', p);
}

// Rubrique 3 : objectifs et stratégie (SMART, SCP)
function rubrique3(p) {
  const smart = (o) => !!(o.intitule && o.indicateur && o.valeur_cible && o.justification && o.echeance);
  const objectifs = listeCartes(db.objectifs.filter((o) => o.plan_id === p.id), (o) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(o.intitule)}</span><span class="badge">${esc(libelle(TYPES_OBJ, o.type))}</span></div>
      <div class="doux">Indicateur : ${esc(o.indicateur || '—')} · Cible : ${esc(o.valeur_cible || '—')} · Échéance : ${esc(o.echeance || '—')}</div>
      ${o.justification ? `<div class="doux">Atteignable et réaliste : ${esc(o.justification)}</div>` : ''}
      <div class="ligne"><span class="badge${smart(o) ? ' ok' : ''}">${smart(o) ? 'SMART complet' : 'SMART incomplet'}</span>
      <span><button class="petit sec" data-act="objectif-modifier" data-id="${o.id}">Modifier</button>
      <button class="petit danger" data-act="supprimer" data-t="objectifs" data-id="${o.id}">Supprimer</button></span></div></div>`,
  'Aucun objectif. Fixez au moins un objectif SMART.');
  const segments = listeCartes(db.segments.filter((s) => s.plan_id === p.id), (s) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(s.nom)}</span>${s.critere ? `<span class="badge">${esc(libelle(CRITERES, s.critere))}</span>` : ''}</div>
      ${s.description ? `<div class="doux">${esc(s.description)}</div>` : ''}
      <div class="ligne"><span class="doux">Taille estimée : ${fmt(s.taille_estimee)}</span>
      <button class="petit danger" data-act="supprimer" data-t="segments" data-id="${s.id}">Supprimer</button></div></div>`,
  'Aucun segment.');
  const personas = listeCartes(db.personas.filter((x) => x.plan_id === p.id), (x) => `
    <div class="carte"><div class="titre">${esc(x.nom)}</div>
      ${x.description ? `<div class="doux">${esc(x.description)}</div>` : ''}
      ${x.besoins ? `<div class="doux">Besoins : ${esc(x.besoins)}</div>` : ''}
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="personas" data-id="${x.id}">Supprimer</button></div></div>`,
  'Aucun persona.');
  return `${section('Objectifs (méthode SMART)', '<button class="petit" data-act="objectif-ajouter">+ Objectif</button>')}${objectifs}
    ${section('Segmentation', '<button class="petit" data-act="segment-ajouter">+ Segment</button>')}${segments}
    ${carteGroupe('strategie', p)}
    ${section('Buyer personas', '<button class="petit" data-act="persona-ajouter">+ Persona</button>')}${personas}`;
}

// Rubrique 4 : marketing mix
function rubrique4(p) {
  const sept = p.mode_mix === '7P';
  return `<div class="carte"><div class="ligne"><span>Modèle : <b>${sept ? '7P (services)' : '4P (biens)'}</b></span>
    <button class="petit sec" data-act="mode-mix">${sept ? 'Revenir aux 4P' : 'Passer aux 7P'}</button></div></div>
    ${carteGroupe('mix4', p)}${sept ? carteGroupe('mix3', p) : ''}`;
}

// Rubrique 5 : plan d'action, calendrier, budget, compte d'exploitation
function rubrique5(p) {
  const actions = listeCartes(db.actions.filter((a) => a.plan_id === p.id)
    .sort((a, b) => String(a.date_debut).localeCompare(String(b.date_debut)) || a.id - b.id), (a) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(a.description)}</span><span class="badge">${esc(a.phase || '')}</span></div>
      <div class="doux">${esc(a.canal)} · ${esc(a.date_debut || '—')} → ${esc(a.date_fin || '—')}</div>
      <div class="ligne"><span class="doux">Coût prévu : ${fmt(a.cout_prevu)}</span>
      <button class="petit danger" data-act="supprimer" data-t="actions" data-id="${a.id}">Supprimer</button></div></div>`,
  'Aucune action.');
  const lignes = db.budgets.filter((b) => b.plan_id === p.id);
  const alloue = somme(lignes, (b) => b.montant_prevu), reste = p.budget_total - alloue;
  const budget = `<div class="carte"><div class="grille">
      <div><span>Budget total</span>${fmt(p.budget_total)}</div><div><span>Alloué</span>${fmt(alloue)}</div>
      <div><span>Reste à allouer</span><b class="${reste < 0 ? 'neg' : ''}">${fmt(reste)}</b></div></div></div>
    ${listeCartes(lignes, (b) => `<div class="carte"><div class="ligne"><span class="titre">${esc(b.canal)}</span><span>${fmt(b.montant_prevu)}</span></div>
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="budgets" data-id="${b.id}">Supprimer</button></div></div>`, 'Aucune ligne de budget.')}`;
  const prod = produitDe(p), c = compteExploitation(p);
  const classe = (v) => (v == null ? '' : v < 0 ? 'neg' : 'pos');
  const manque = [];
  if (p.ventes_prevues == null) manque.push('Renseignez les ventes prévues.');
  if (!prod || prod.prix_unitaire == null || prod.cout_unitaire == null) manque.push("Renseignez le prix et le coût unitaires du produit (onglet Produits).");
  const corps = c ? `<div class="grille">
      <div><span>Ventes prévues (unités)</span>${fmt(p.ventes_prevues)}</div><div><span>Chiffre d'affaires</span>${fmt(c.ca)}</div>
      <div><span>Coût des ventes</span>${fmt(c.cv)}</div><div><span>Marge brute</span>${fmt(c.marge)}</div>
      <div><span>Frais marketing directs</span>${fmt(c.frais)}</div>
      <div><span>Contribution marketing nette</span><b class="${classe(c.contribution)}">${fmt(c.contribution)}</b></div>
      <div><span>ROMI prévisionnel</span><b class="${classe(c.romi)}">${c.romi == null ? '—' : fmt(c.romi) + ' %'}</b></div></div>`
    : `<div class="doux">${manque.join(' ')}</div>`;
  const seuil = p.seuil ? `<div class="doux" style="margin-top:8px">Seuil de rentabilité : ${p.seuil.unites == null
    ? 'marge unitaire nulle ou négative'
    : fmt(p.seuil.unites) + ' unités (marge unitaire ' + fmt(p.seuil.marge) + ', charges à couvrir ' + fmt(p.seuil.charges) + ')'}</div>` : '';
  const compte = `<div class="carte"><div class="ligne"><h3>Compte d'exploitation prévisionnel</h3>
    <button class="petit sec" data-act="editer-groupe" data-g="ventes">${p.ventes_prevues == null ? 'Renseigner' : 'Modifier'}</button></div>
    ${corps}${seuil}</div>`;
  return `${section('Plan d\'action et calendrier', '<button class="petit" data-act="action-ajouter">+ Action</button>')}${actions}
    ${section('Budget marketing', '<button class="petit" data-act="budget-ajouter">+ Ligne</button>')}${budget}
    ${compte}`;
}

// Rubrique 6 : pilotage et contrôle
function rubrique6(p) {
  const e = calculerEcarts(p), t = e.total;
  const cl = (v) => (v == null ? '' : v < 0 ? 'neg' : 'pos');
  const pct = (v) => (v == null ? '—' : fmt(v) + ' %');
  const ltv = calculerLtv(p);
  const note = e.tm == null ? `<div class="doux">Renseignez le prix et le coût unitaires du produit pour calculer la contribution et le ROMI.</div>` : '';
  const indicateurs = `<div class="carte"><h3>Indicateurs du plan</h3><div class="grille">
      <div><span>Budget prévu</span>${fmt(t.prevu)}</div><div><span>Dépense réelle</span>${fmt(t.depense)}</div>
      <div><span>Chiffre d'affaires</span>${fmt(t.ca)}</div><div><span>Taux de conversion</span>${pct(t.conversion)}</div>
      <div><span>Coût d'acquisition (CAC)</span>${fmt(t.cac)}</div>
      <div><span>Contribution marketing nette</span><b class="${cl(t.contribution)}">${fmt(t.contribution)}</b></div>
      <div><span>ROMI</span><b class="${cl(t.romi)}">${pct(t.romi)}</b></div></div>${note}</div>
    <div class="carte"><div class="ligne"><h3>Valeur vie client (LTV)</h3>
      <button class="petit sec" data-act="editer-groupe" data-g="ltv">${ltv == null ? 'Renseigner' : 'Modifier'}</button></div>
      ${ltv == null ? '<div class="doux">Renseignez la marge annuelle moyenne par client et la durée de la relation.</div>'
    : `<div class="grille"><div><span>Marge par client et par an</span>${fmt(p.ltv.marge)}</div>
      <div><span>Durée de la relation (années)</span>${fmt(p.ltv.duree)}</div>
      <div><span>LTV</span><b>${fmt(ltv)}</b></div></div>`}</div>
    <div class="carte"><div class="ligne"><h3>Part de voix</h3>
      <button class="petit sec" data-act="editer-groupe" data-g="pv">${p.part_de_voix == null ? 'Renseigner' : 'Modifier'}</button></div>
      <div class="doux">${p.part_de_voix == null ? 'Non renseignée (saisie à partir de vos mesures de marché).' : fmt(p.part_de_voix) + ' %'}</div></div>`;
  const canaux = listeCartes(e.lignes, (x) => `
    <div class="carte"><div class="titre">${esc(x.canal)}</div><div class="grille">
      <div><span>Budget prévu</span>${fmt(x.prevu)}</div><div><span>Dépense réelle</span>${fmt(x.depense)}</div>
      <div><span>Écart budgétaire</span>${fmt(x.ecart)}</div><div><span>Chiffre d'affaires</span>${fmt(x.ca)}</div>
      <div><span>Taux de conversion</span>${pct(x.conversion)}</div><div><span>CAC</span>${fmt(x.cac)}</div>
      <div><span>Contribution nette</span><b class="${cl(x.contribution)}">${fmt(x.contribution)}</b></div>
      <div><span>ROMI</span><b class="${cl(x.romi)}">${pct(x.romi)}</b></div></div></div>`,
  'Ajoutez un budget et des résultats pour voir les écarts.');
  const resultats = listeCartes(db.resultats.filter((r) => r.plan_id === p.id), (r) => `
    <div class="carte"><div class="ligne"><span class="titre">${esc(r.canal)}</span><span class="doux">${esc(r.periode || '')}</span></div>
      <div class="grille"><div><span>Dépense</span>${fmt(r.depense_reelle)}</div><div><span>CA</span>${fmt(r.chiffre_affaires)}</div>
      <div><span>Prospects</span>${fmt(r.prospects)}</div><div><span>Clients</span>${fmt(r.clients_acquis)}</div></div>
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="resultats" data-id="${r.id}">Supprimer</button></div></div>`,
  'Aucun résultat saisi.');
  const contingences = listeCartes(db.contingences.filter((c) => c.plan_id === p.id), (c) => `
    <div class="carte"><div class="titre">${esc(c.scenario)}</div>
      ${c.declencheur ? `<div class="doux">Déclencheur : ${esc(c.declencheur)}</div>` : ''}
      ${c.action ? `<div class="doux">Action corrective : ${esc(c.action)}</div>` : ''}
      <div class="rangee"><button class="petit danger" data-act="supprimer" data-t="contingences" data-id="${c.id}">Supprimer</button></div></div>`,
  'Aucun scénario de contingence.');
  return `${indicateurs}${section('Écarts prévu/réalisé par canal')}${canaux}
    ${section('Résultats réels', '<button class="petit" data-act="resultat-ajouter">+ Résultat</button>')}${resultats}
    ${section('Plan de contingence', '<button class="petit" data-act="contingence-ajouter">+ Scénario</button>')}${contingences}`;
}

// ---------------------------------------------------------------- Actions
const planId = () => Number((location.hash.match(/^#\/plan\/(\d+)/) || [])[1] || 0);
const planCourant = () => db.plans.find((x) => x.id === planId());

function objectifForm(id) {
  const o = id ? db.objectifs.find((x) => x.id === id) : { type: 'quantitatif' };
  formulaire(id ? "Modifier l'objectif" : 'Nouvel objectif SMART', [
    { name: 'type', label: 'Type', type: 'select', options: TYPES_OBJ },
    { name: 'intitule', label: 'Objectif (spécifique)', req: true },
    { name: 'indicateur', label: 'Indicateur (mesurable) — ex. chiffre d\'affaires, part de marché, NPS' },
    { name: 'valeur_cible', label: 'Valeur cible (mesurable)' },
    { name: 'justification', label: 'Pourquoi est-il atteignable et réaliste ?', type: 'textarea' },
    { name: 'echeance', label: 'Échéance (temporellement défini)', type: 'date' },
  ], o, (f) => {
    const v = { type: f.type, intitule: f.intitule, indicateur: f.indicateur, valeur_cible: f.valeur_cible,
      justification: f.justification, echeance: f.echeance || '' };
    if (id) Object.assign(o, v); else db.objectifs.push(Object.assign({ id: nid(), plan_id: planId() }, v));
    sauver(); afficher();
  });
}

const ACTIONS = {
  onglet: (d) => { onglet = d.v; aideOuverte = false; afficher(); },
  aide: () => { aideOuverte = !aideOuverte; afficher(); },

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

  'editer-groupe': (d) => {
    const p = planCourant(), g = GROUPES[d.g];
    if (!p || !g) return;
    const obj = g.obj(p);
    formulaire(g.titre, g.champs, obj, (f) => {
      g.champs.forEach((c) => { obj[c.name] = c.type === 'number' ? num(f[c.name]) : (f[c.name] || ''); });
      sauver(); afficher();
    });
  },
  'mode-mix': () => {
    const p = planCourant();
    p.mode_mix = p.mode_mix === '7P' ? '4P' : '7P';
    sauver(); afficher();
  },
  'copier-resume': async () => {
    const ok = await copierTexte(texteResume(planCourant()));
    toast(ok ? 'Résumé copié' : 'Copie impossible sur cet appareil');
  },

  'objectif-ajouter': () => objectifForm(null),
  'objectif-modifier': (d) => objectifForm(Number(d.id)),
  'segment-ajouter': () => formulaire('Nouveau segment', [
    { name: 'nom', label: 'Nom', req: true }, { name: 'description', label: 'Description (besoins, comportements)' },
    { name: 'critere', label: 'Critère de segmentation', type: 'select', options: CRITERES },
    { name: 'taille', label: 'Taille estimée', type: 'number' }], {}, (f) => {
    db.segments.push({ id: nid(), plan_id: planId(), nom: f.nom, description: f.description, critere: f.critere, taille_estimee: num(f.taille) });
    sauver(); afficher();
  }),
  'persona-ajouter': () => formulaire('Nouveau persona', [
    { name: 'nom', label: 'Nom du persona', req: true }, { name: 'description', label: 'Profil', type: 'textarea' },
    { name: 'besoins', label: 'Besoins et motivations d\'achat', type: 'textarea' }], {}, (f) => {
    db.personas.push({ id: nid(), plan_id: planId(), nom: f.nom, description: f.description, besoins: f.besoins });
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
  'contingence-ajouter': () => formulaire('Scénario de contingence', [
    { name: 'scenario', label: "Scénario (ex. riposte agressive d'un concurrent)", req: true },
    { name: 'declencheur', label: 'Seuil de déclenchement', type: 'textarea' },
    { name: 'action', label: 'Action corrective prévue', type: 'textarea' }], {}, (f) => {
    db.contingences.push({ id: nid(), plan_id: planId(), scenario: f.scenario, declencheur: f.declencheur, action: f.action });
    sauver(); afficher();
  }),
  supprimer: (d) => {
    if (!confirm('Supprimer cet élément ?')) return;
    db[d.t] = db[d.t].filter((x) => x.id !== Number(d.id));
    sauver(); afficher();
  },

  exporter: async () => {
    const nom = 'plan-marketing-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
    const contenu = JSON.stringify(db, null, 2);
    // Application Android (APK) : écriture dans le cache puis partage natif (Drive, e-mail, fichiers…)
    if (estNatif()) {
      const P = window.Capacitor.Plugins || {};
      if (P.Filesystem && P.Share) {
        try {
          const r = await P.Filesystem.writeFile({ path: nom, data: contenu, directory: 'CACHE', encoding: 'utf8' });
          await P.Share.share({ title: nom, url: r.uri });
          toast('Sauvegarde prête');
        } catch (err) {
          const m = String((err && err.message) || err || '');
          if (!/cancel/i.test(m)) toast('Export impossible : ' + m);
        }
        return;
      }
    }
    // Navigateur : téléchargement classique
    const blob = new Blob([contenu], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nom;
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

// Informations générales du plan (les autres champs se saisissent dans les rubriques)
function planForm(id) {
  const p = id ? db.plans.find((x) => x.id === id) : {};
  formulaire(id ? 'Modifier le plan' : 'Nouveau plan', [
    { name: 'produit_id', label: 'Produit', type: 'select', options: optProduits() },
    { name: 'titre', label: 'Titre', req: true }, { name: 'objectif', label: 'Objectif général' },
    { name: 'date_lancement', label: 'Date de lancement', type: 'date' },
    { name: 'budget_total', label: 'Budget total', type: 'number' },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS },
  ], Object.assign({ statut: 'brouillon' }, p), (f) => {
    const o = { produit_id: Number(f.produit_id), titre: f.titre, objectif: f.objectif, statut: f.statut,
      budget_total: num(f.budget_total) || 0, date_lancement: f.date_lancement || null };
    if (id) Object.assign(p, o);
    else {
      id = nid();
      const nouveau = Object.assign(planDefaut(), { id }, o);
      normaliserPlan(nouveau);
      db.plans.push(nouveau);
    }
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
  prochainOnglet = 'r2';
  toast('Plan généré : complétez les rubriques');
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
      db = Object.assign(vide(), d); migrer(db);
      sauver(); location.hash = '#/plans'; afficher(); toast('Sauvegarde importée');
    } catch (err) { toast('Fichier de sauvegarde invalide'); }
  };
  lecteur.readAsText(e.target.files[0]);
});

window.addEventListener('hashchange', () => {
  onglet = prochainOnglet || 'r1'; prochainOnglet = null; aideOuverte = false; afficher();
});
afficher();

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0 && !estNatif()) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne non disponible */ });
}
