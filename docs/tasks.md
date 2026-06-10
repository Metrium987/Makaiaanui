# Makaiaanui — Task Tracker

> **Méthodologie :** chaque tâche est atomique. Une tâche est ✅ uniquement si **fonctionnelle** sur Vercel ET local.
> **Bible de référence :** `supabase/combined_schema.sql` — toute tâche touchant la DB doit le mettre à jour.
> **Roadmap source :** `feature.md`

---

## 📐 Architecture documentaire

```
makaiaanui/
├── feature.md              ← Roadmap 6 phases (vision)
├── docs/tasks.md           ← Task tracker (ce fichier) — suivi quotidien
├── supabase/combined_schema.sql ← Bible DB — source de vérité unique
└── .codebuff/trace.jsonl   ← Journal de session automatisé
```

**Règle d'or :** `combined_schema.sql` est la source de vérité. Si une tâche modifie la DB, elle doit :
1. Mettre à jour `combined_schema.sql`
2. Appliquer le changement sur Supabase
3. Vérifier que l'app fonctionne avec

---

## Phase 1 — Squelette fonctionnel rôles (en cours)

> **Ordre d'exécution :** P1.1 → P1.4 → P1.2 → P1.5
> Chaque tâche dépend de la précédente. P1.3 est couvert par P1.2 (le dashboard différencié EST la cible de la redirection).

### P1.1 — Sidebar filtrée par rôle ◄ FONDATION
**Fichiers :** `src/components/layout/Sidebar.tsx`  
**Schéma :** `profiles.role` (CHECK: MEMBER, FRONT_OFFICE, BACK_OFFICE, ADMIN)  
**Dépendances :** aucune  
**Critère succès :** MEMBER ne voit PAS CRM, Settings, User Management, Audit Log. ADMIN voit tout.

- [x] Filtrer `navigation` dynamiquement selon `useAppStore().role`
- [x] MEMBER : masquer CRM (`/app/crm`), Settings (`/app/settings`), Audit Log (`/app/audit-log`)
- [x] BACK_OFFICE : masquer Settings, Audit Log
- [x] ADMIN : tout visible
- [ ] Tester visuellement sur Vercel avec un compte MEMBER et ADMIN (après push + déploiement)

### P1.4 — Ajouter /app/users dans la sidebar admin ◄ QUICK WIN
**Fichiers :** `src/components/layout/Sidebar.tsx`  
**Schéma :** n/a  
**Dépendances :** P1.1  
**Critère succès :** ADMIN voit "User Management" dans la sidebar. `/app/users` fonctionnel.

- [x] Ajouter User Management dans ALL_NAVIGATION (href=/app/users, icon=Users, roles=[ADMIN])
- [x] Visible uniquement pour ADMIN (via P1.1)
- [ ] Tester que UserManagement.tsx répond sur Vercel (apres push)

### P1.2 — Dashboard MEMBER ◄ CŒUR DE PHASE 1
**Fichiers :** `src/pages/Dashboard.tsx`  
**Schéma :** n/a (frontend only)  
**Dépendances :** P1.1  
**Critère succès :** MEMBER → dashboard commande épuré. ADMIN → dashboard actuel (stats, KPIs). Login email + Google OAuth fonctionnent pour les 2 rôles.

- [x] Conditionner l'affichage selon `useAppStore().role`
- [x] MEMBER : titre "Catalogue & Commandes", pas de stats globales, pas de KPIs
- [x] MEMBER : banniere Portal CTA + 9 cartes modules cliquables
- [x] ADMIN : dashboard actuel inchange (stats, compteurs, etc.)
- [x] Verifier que `navigate('/app')` apres login atterrit sur le bon dashboard
- [ ] Tester login MEMBER et ADMIN sur Vercel (email + Google)

### P1.5 — CRUD filtré par rôle dans les modules ◄ FINAL
**Fichiers :** 11 modules (Transport, Accommodation, Catering, Hospitalities, Accreditations, Deliveries, Laundry, Uniforms, Additional Services, CRM, Settings)  
**Schéma :** RLS déjà en place — SELECT pour MEMBER, ALL pour BACK_OFFICE+ADMIN  
**Dépendances :** P1.1, P1.2  
**Critère succès :** MEMBER voit les données en lecture seule. ADMIN/BACK_OFFICE ont boutons Create/Edit/Delete. Les RLS bloquent bien MEMBER côté DB.

- [x] 9 modules : masquer boutons Create/Edit/Delete/QuickActions + checkboxes si MEMBER (isReadOnly pattern)
- [ ] MEMBER : ajouter un lien/bouton "Demander ce service" → ouvre Client Portal (→ P2.1)
- [x] Vérifié via code-search : 43 occurrences isReadOnly dans 9 modules
- [x] Vercel déployé (57ba954), landing + login pages OK, 0 erreurs JS
- [ ] Test visuel manuel : login ADMIN vs MEMBER sur Vercel

---

## Phase 2 — Client Portal & Workflow demandes

### P2.1 — MEMBER soumet demandes via Portal
**Fichiers :** `src/pages/ClientPortal.tsx`, `src/hooks/useApi.ts`  
**Schéma :** `client_requests` (déjà dans combined_schema.sql §9)  
**Critère succès :** Un MEMBER peut créer une demande (module, titre, description) → apparaît en PENDING.

- [x] Formulaire de création fonctionnel (module, titre, description, client_name, client_email)
- [x] Auto-fill client_email + client_name depuis la session pour MEMBER
- [x] Ajout colonne created_by dans client_requests (schema + types + hook)
- [x] La demande est enregistrée avec status=PENDING + created_by=auth.uid()
- [x] TypeScript + build OK
- [ ] Appliquer ALTER TABLE created_by sur Supabase
- [ ] Tester sur Vercel : MEMBER crée demande → apparaît PENDING

### P2.2 — ADMIN/BACK_OFFICE approuve/rejette demandes
**Fichiers :** `src/pages/ClientPortal.tsx`  
**Schéma :** RLS `client_requests` — UPDATE pour BACK_OFFICE+ADMIN  
**Critère succès :** Un ADMIN peut changer le statut PENDING → APPROVED ou REJECTED avec raison.

- [x] Boutons Approve/Reject visibles pour BACK_OFFICE+ADMIN (isBackOffice) ✅
- [x] handleApprove: status=APPROVED, approved_by=userId, approved_at=now ✅
- [x] handleReject: status=REJECTED, rejection_reason ✅
- [x] Bouton Delete corrigé : ADMIN uniquement (RLS cohérent)
- [ ] Tester sur Vercel : BACK_OFFICE approuve/rejette une demande

### P2.3 — BACK_OFFICE change statuts (IN_PROGRESS → COMPLETED)
**Schéma :** idem P2.2  
**Critère succès :** BACK_OFFICE peut faire évoluer le statut après approbation.

- [x] handleStartProgress: APPROVED → IN_PROGRESS ✅
- [x] handleComplete: IN_PROGRESS → COMPLETED ✅
- [x] Boutons visibles pour BACK_OFFICE+ADMIN (isBackOffice) ✅
- [x] RLS UPDATE autorise BACK_OFFICE+ADMIN ✅
- [x] TypeScript + build OK
- [ ] Tester sur Vercel : workflow complet PENDING→APPROVED→IN_PROGRESS→COMPLETED

### P2.4 — Filtrage demandes par rôle
**Fichiers :** `src/pages/ClientPortal.tsx`  
**Schéma :** n/a (filtrage frontend ou via query)  
**Critère succès :** MEMBER voit UNIQUEMENT ses propres demandes. ADMIN/BACK_OFFICE voient tout.

- [x] MEMBER : filtre `created_by = auth.uid()` dans fetchRequests ✅
- [x] ADMIN/BACK_OFFICE : toutes les demandes de l'org (pas de filtre) ✅
- [x] TypeScript + build OK
- [ ] Tester sur Vercel : MEMBER ne voit que ses demandes, ADMIN voit tout

---

## Phase 3 — Groupes & Pays

### P3.1 — Table `groups` dans combined_schema.sql
**Schéma :** `groups(id, name, organization_id, created_at)`  
**Critère succès :** La table existe sur Supabase, le schema est dans combined_schema.sql.

- [x] CREATE TABLE groups (id, name, organization_id, timestamps) ✅
- [x] 3 indexes (org, name, created_at) ✅
- [x] RLS: SELECT all org, ALL BACK_OFFICE+ADMIN ✅
- [x] Trigger updated_at ✅
- [x] 13 references dans combined_schema.sql (sections 4,5,8,10) ✅
- [ ] Appliquer le CREATE TABLE sur Supabase (SQL Editor)

### P3.2 — Assignation groupe à la création de compte
**Fichiers :** `src/pages/Login.tsx` (signUp), `supabase/combined_schema.sql` (trigger handle_new_user)  
**Schéma :** `profiles.group_id` FK → `groups.id`  
**Critère succès :** À l'inscription, le MEMBER choisit ou se voit assigner un groupe/pays.

- [ ] Ajouter `group_id UUID REFERENCES groups(id)` dans `profiles`
- [ ] Mettre à jour le signUp flow
- [ ] Tester sur Vercel

### P3.3 — Interface admin gérer les groupes
**Fichiers :** nouvelle page ou intégré dans Settings  
**Critère succès :** ADMIN peut créer/lister/modifier/supprimer des groupes.

- [ ] CRUD groupes
- [ ] Tester sur Vercel

---

## Phase 4 — REPRESENTANT & Flux groupe *(futur)*

### P4.1 — Nouveau rôle REPRESENTANT
**Schéma :** `profiles.role` — ajouter 'REPRESENTANT' au CHECK  
**Critère succès :** Un utilisateur peut avoir le rôle REPRESENTANT, avec droits spécifiques.

### P4.2 — Dashboard consolidation
**Critère succès :** Le REPRESENTANT voit toutes les demandes de son groupe, peut les trier/regrouper.

### P4.3 — Workflow commande groupée
**Critère succès :** REPRESENTANT consolide → BACK_OFFICE reçoit et traite la commande groupée.

---

## Phase 5 — Enrichissement modules *(par priorité métier)*

À segmenter plus tard, module par module, selon `feature.md` §2 et `makaiaanui-modules-v1-conservateur.md`.

---

## Phase 6 — Apps Mobiles *(long terme)*

À définir.

---

## 📋 Conventions

- Chaque tâche cochée = **fonctionnelle sur Vercel ET local**
- Si une tâche touche la DB → `combined_schema.sql` doit être mis à jour dans le même commit
- Un test browser-use ou API curl valide chaque tâche
- Le trace log `.codebuff/trace.jsonl` enregistre chaque décision
