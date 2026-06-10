# Makaiaanui — Feature Specification & Roadmap

> **Version :** 2.0 — fusion du document expert métier + architecture rôles
> **Stack :** React 19 + Vite 6 + Tailwind 4 / Supabase / Vercel
> **Auth :** email/password + Google OAuth

---

## 1. Architecture Rôles (décisions actées)

### Flux de commande
```
FRONT_OFFICE (public)  →  Landing vitrine Jeux du Pacifique
         │
         ▼ login
      MEMBER           →  Dashboard commande
         │                 • Catalogue modules (lecture seule, prix, dispo)
         │                 • Soumet demandes via Client Portal
         │                 • Ne voit QUE ses propres demandes
         │                 • Pas de CRUD, pas de stocks, pas d'admin
         │
         ▼
   REPRESENTANT *(futur)* →  Dashboard consolidation
                              • Voit TOUTES les demandes de son groupe/pays
                              • Trie, regroupe, valide → envoi commande groupée
         │
         ▼
   BACK_OFFICE          →  Dashboard opérationnel
                              • Reçoit les commandes groupées
                              • Approuve/rejette les demandes
                              • Gère les stocks, la logistique
                              • Change statuts : IN_PROGRESS → COMPLETED
         │
         ▼
      ADMIN             →  Dashboard actuel (stats, KPIs)
                              • Peut tout faire (CRUD, approve, users, settings)
                              • Dans les faits : supervise, BACK_OFFICE gère le quotidien
```

### Tableau des rôles

| Rôle | Accès | Dashboard | Modules |
|---|---|---|---|
| **FRONT_OFFICE** | Public (pas de login) | Landing = vitrine Jeux du Pacifique | Aucun |
| **MEMBER** | Login requis | Dashboard « commande » épuré | Lecture seule + prix/dispo + Client Portal (demandes perso) |
| **REPRESENTANT** *(futur)* | Login requis | Dashboard consolidation groupe | Lecture seule + Portal (toutes les demandes du groupe) |
| **BACK_OFFICE** | Login requis | Dashboard opérationnel | Gestion stocks, logistique, approve/reject demandes, exécution |
| **ADMIN** | Login requis | Dashboard actuel (stats, KPIs) | CRUD complet, User Mgmt, Settings, CRM, Audit Log |

---

## 2. Modules — État actuel vs Cible

### 2.1. Transport (`/app/transport`) ✅ Squelette OK
**Existant :** shifts (quarts chauffeurs) + transferts (points A→B, PAX, conducteur assigné)
**Cible :** cf. `makaiaanui-modules-v1-conservateur.md` §2.1 — géolocalisation live, tarification, catégorisation courses, suivi aéroport, voucher QR, notifications, incidents, empreinte carbone, apps mobiles (Driver, Dispatch)

### 2.2. Hébergement (`/app/accommodation`) ✅ Squelette OK
**Existant :** rooming-list (guest, group, hotel, room type, check-in, statut)
**Cible :** cf. §2.2 — allotements contractuels, release back, rooming-mates, pré-check-in digital, multi-devise, bordereau taxe de séjour, self-service client

### 2.3. Restauration (`/app/catering`) ✅ Squelette OK
**Existant :** menus (titre, format, couverts, horaires, compteurs régimes VEG/VGN/GF/HALAL)
**Cible :** cf. §2.3 — plan de salle, confirmation J-3/J-1, boissons, HACCP, QR code menu, anti-gaspi, photo des plats

### 2.4. Hospitalités (`/app/hospitalities`) ✅ Squelette OK
**Existant :** packages VIP (titre, prix, capacité, ventes) + sièges (section, invité, numéro)
**Cible :** cf. §2.4 — Stripe/paiement, plan tribune interactif, QR code billet, welcome bag, live polling, streaming, fidélité

### 2.5. Accréditations (`/app/accreditations`) ✅ Squelette OK
**Existant :** groupes démographiques (code, nom, compteurs imprimés/en attente, zones)
**Cible :** cf. §2.5 — template badge personnalisé, photo/CNI upload, workflow validation multi-niveau, RFID/NFC, biométrie, scan offline, contrôle d'accès

### 2.6. Livraisons (`/app/deliveries`) ✅ Squelette OK
**Existant :** tickets livraison (contenu, site destination, statut, heure prévue, QR signoff)
**Cible :** cf. §2.6 — fenêtres de livraison, tracking GPS, POD électronique, ADR, cross-docking, plan de charge site

### 2.7. Laverie (`/app/laverie`) ✅ Squelette OK
**Existant :** demandes (client, groupe, type service, nombre items, statut collecté→en cours→prêt→retourné)
**Cible :** cf. §2.7 — code-barres/RFID, niveau de service (express/standard), pesée, audit qualité, RSE

### 2.8. Uniformes (`/app/uniforms`) ✅ Squelette OK
**Existant :** articles (description, tailles, total acquis, déployés, statut)
**Cible :** cf. §2.8 — mensurations, packages par rôle, personnalisation (broderie), multi-sites, retours, EPI

### 2.9. Services Additionnels (`/app/services-additionnels`) ✅ Squelette OK
**Existant :** catalogue (nom, catégorie, prix, vendus/limite, statut)
**Cible :** cf. §2.9 — QR code, paiement en ligne, liste d'attente, kiosque self-service, fidélité

### 2.10. Client Portal (`/app/portal`) ✅ Squelette OK
**Existant :** demandes (module, titre, description, client, email, statut PENDING→APPROVED→IN_PROGRESS→COMPLETED)
**Cible :** workflow multi-niveau (REPRESENTANT → BACK_OFFICE → ADMIN)

### 2.11. CRM (`/app/crm`) ✅ Squelette OK
**Existant :** entités (nom, catégorie, contact, email, statut)
**Cible :** pipeline commercial, contrats, facturation

### 2.12. User Management (`/app/users`) ✅ Existant (hors sidebar)
**Existant :** liste utilisateurs, changement rôle, invitation, suppression, export CSV
**Cible :** groupes/pays, RBAC granulaire par module

### 2.13. Audit Log (`/app/audit-log`) ✅ Squelette OK
**Cible :** traçabilité complète (qui, quoi, quand, IP/device)

### 2.14. Settings (`/app/settings`) ✅ Squelette OK
**Cible :** paramétrage global, groupes/pays, workflow config

---

## 3. Modules Mobiles (futur — non implémentés)

| App | Usage | Priorité |
|---|---|---|
| **Element Driver** | Chauffeurs : reçoit missions, met à jour statut, scan voucher | Moyenne |
| **Element Dispatch** | Coordinateurs : timeline jour J, assignation, incidents | Moyenne |
| **Element Floor** | Hôtes/hôtesses : pointage, orientation, encaissement | Basse |
| **Element Scan** | Sécurité/accueil : scan badges, contrôle accès, offline | Basse |

---

## 4. Roadmap

### Phase 1 — Squelette fonctionnel rôles ✅ (en cours)
- [x] Auth email/password + Google OAuth
- [x] Safe proxy Supabase (grâce au déploiement sans credentials)
- [x] AuthRedirector (callback OAuth)
- [x] Sidebar affiche le vrai rôle
- [ ] Sidebar filtrée par rôle (masquer modules inaccessibles)
- [ ] Dashboard différencié MEMBER vs ADMIN
- [ ] Ajouter `/app/users` dans la sidebar admin
- [ ] CRUD filtré par rôle dans chaque module (lecture seule MEMBER)

### Phase 2 — Client Portal & Workflow demandes
- [ ] MEMBER : soumettre demandes via Portal
- [ ] ADMIN : approuver/rejeter demandes
- [ ] BACK_OFFICE : approuver/rejeter + traiter demandes (IN_PROGRESS→COMPLETED)
- [ ] Notifications email (confirmation, changement statut)
- [ ] Filtrage demandes par rôle (MEMBER voit les siennes, ADMIN tout)

### Phase 3 — Groupes & Pays
- [ ] Table `groups` dans Supabase (pays/régions prédéfinis)
- [ ] Assignation groupe à la création de compte MEMBER
- [ ] Interface admin : gérer les groupes
- [ ] Filtrage par groupe dans le Portal

### Phase 4 — REPRESENTANT & Flux groupe
- [ ] Nouveau rôle REPRESENTANT
- [ ] Dashboard consolidation (voir toutes les demandes du groupe)
- [ ] Workflow : trier → regrouper → valider → envoi groupé
- [ ] BACK_OFFICE : réception et traitement des commandes groupées

### Phase 5 — Enrichissement modules (par priorité métier)
Basé sur `makaiaanui-modules-v1-conservateur.md`. Chaque module reçoit :
- Tarification & facturation
- Workflow de validation
- Notifications
- Exports avancés
- QR codes / scans

### Phase 6 — Apps Mobiles (long terme)
- Driver App, Dispatch App, Floor App, Scan App
- Mode offline, synchronisation différée
- PWA ou natif (React Native)

---

## 5. Couches transverses (communes à tous les modules)

| Couche | Phase |
|---|---|
| RBAC granulaire (par module, par action) | Phase 1 |
| Notifications multicanal (email, SMS, push) | Phase 2 |
| Audit trail complet | Phase 2 |
| Multi-devise | Phase 5 |
| Conformité RGPD | Phase 5 |
| Mode offline (apps mobiles) | Phase 6 |
| Internationalisation (FRA/ENG + extensible) | ✅ Partiel (FRA/ENG existant) |
