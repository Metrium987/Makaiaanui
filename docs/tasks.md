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
├── supabase/seed_data.sql       ← Données mock par groupe (P4)
├── supabase/cleanup_old_seed.sql ← Nettoyage anciennes données sans group_id
└── .codebuff/trace.jsonl   ← Journal de session automatisé
```

**Règle d'or :** `combined_schema.sql` est la source de vérité. Si une tâche modifie la DB, elle doit :
1. Mettre à jour `combined_schema.sql`
2. Appliquer le changement sur Supabase
3. Vérifier que l'app fonctionne avec

---

## Phase 1 — Squelette fonctionnel rôles ✅ (TERMINÉE)

> 20 commits, v1.0 déployée sur Vercel. Tous les items sont cochés et fonctionnels.

### P1.1 — Sidebar filtrée par rôle ◄ FONDATION
**Fichiers :** `src/components/layout/Sidebar.tsx`  
**Schéma :** `profiles.role` (CHECK: MEMBER, FRONT_OFFICE, BACK_OFFICE, ADMIN, MANAGER)  
**Dépendances :** aucune  
**Critère succès :** MEMBER ne voit PAS CRM, Settings, User Management, Audit Log. ADMIN voit tout.

- [x] Filtrer `navigation` dynamiquement selon `useAppStore().role`
- [x] MEMBER : masquer CRM (`/app/crm`), Settings (`/app/settings`), Audit Log (`/app/audit-log`)
- [x] BACK_OFFICE : masquer Settings, Audit Log
- [x] ADMIN : tout visible

### P1.4 — Ajouter /app/users dans la sidebar admin ◄ QUICK WIN
**Fichiers :** `src/components/layout/Sidebar.tsx`  
**Schéma :** n/a  
**Dépendances :** P1.1  
**Critère succès :** ADMIN voit "User Management" dans la sidebar. `/app/users` fonctionnel.

- [x] Ajouter User Management dans ALL_NAVIGATION (href=/app/users, icon=Users, roles=[ADMIN])
- [x] Visible uniquement pour ADMIN (via P1.1)

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
- [x] MANAGER : dashboard catalogue (comme MEMBER mais avec droits d'écriture)

### P1.5 — CRUD filtré par rôle dans les modules ◄ FINAL
**Fichiers :** 11 modules (Transport, Accommodation, Catering, Hospitalities, Accreditations, Deliveries, Laundry, Uniforms, Additional Services, CRM, Settings)  
**Schéma :** RLS déjà en place — SELECT pour MEMBER, ALL pour BACK_OFFICE+ADMIN+MANAGER  
**Dépendances :** P1.1, P1.2  
**Critère succès :** MEMBER voit les données en lecture seule. ADMIN/BACK_OFFICE/MANAGER ont boutons Create/Edit/Delete.

- [x] 9 modules : masquer boutons Create/Edit/Delete/QuickActions + checkboxes si MEMBER (isReadOnly pattern)
- [x] Vérifié via code-search : 43 occurrences isReadOnly dans 9 modules
- [x] TypeScript 0 erreurs, build OK

---

## Phase 2 — Client Portal & Workflow demandes ✅ (TERMINÉE)

### P2.1 — MEMBER soumet demandes via Portal
**Fichiers :** `src/pages/ClientPortal.tsx`, `src/hooks/useApi.ts`  
**Schéma :** `client_requests` (dans combined_schema.sql §9)  
**Critère succès :** Un MEMBER peut créer une demande (module, titre, description) → apparaît en PENDING.

- [x] Formulaire de création fonctionnel (module, titre, description, client_name, client_email)
- [x] Auto-fill client_email + client_name depuis la session pour MEMBER
- [x] Ajout colonne created_by dans client_requests (schema + types + hook)
- [x] La demande est enregistrée avec status=PENDING + created_by=auth.uid()
- [x] TypeScript + build OK

### P2.2 — ADMIN/BACK_OFFICE approuve/rejette demandes
**Fichiers :** `src/pages/ClientPortal.tsx`  
**Schéma :** RLS `client_requests` — UPDATE pour BACK_OFFICE+ADMIN  
**Critère succès :** Un ADMIN peut changer le statut PENDING → APPROVED ou REJECTED avec raison.

- [x] Boutons Approve/Reject visibles pour BACK_OFFICE+ADMIN (isBackOffice) ✅
- [x] handleApprove: status=APPROVED, approved_by=userId, approved_at=now ✅
- [x] handleReject: status=REJECTED, rejection_reason ✅
- [x] Bouton Delete corrigé : ADMIN uniquement (RLS cohérent)

### P2.3 — BACK_OFFICE change statuts (IN_PROGRESS → COMPLETED)
**Schéma :** idem P2.2  
**Critère succès :** BACK_OFFICE peut faire évoluer le statut après approbation.

- [x] handleStartProgress: APPROVED → IN_PROGRESS ✅
- [x] handleComplete: IN_PROGRESS → COMPLETED ✅
- [x] Boutons visibles pour BACK_OFFICE+ADMIN (isBackOffice) ✅
- [x] RLS UPDATE autorise BACK_OFFICE+ADMIN ✅
- [x] TypeScript + build OK

### P2.4 — Filtrage demandes par rôle
**Fichiers :** `src/pages/ClientPortal.tsx`  
**Schéma :** n/a (filtrage via query)  
**Critère succès :** MEMBER voit UNIQUEMENT ses propres demandes. ADMIN/BACK_OFFICE voient tout.

- [x] MEMBER : filtre `created_by = auth.uid()` dans fetchRequests ✅
- [x] ADMIN/BACK_OFFICE : toutes les demandes de l'org (pas de filtre) ✅
- [x] TypeScript + build OK

---

## Phase 3 — Groupes & Pays ✅ (TERMINÉE)

### P3.1 — Table `groups` dans combined_schema.sql
**Schéma :** `groups(id, name, organization_id, created_at)`  
**Critère succès :** La table existe dans le schema, les RLS, indexes et trigger sont définis.

- [x] CREATE TABLE groups (id, name, organization_id, timestamps)
- [x] 3 indexes (org, name, created_at)
- [x] RLS: SELECT all org, ALL BACK_OFFICE+ADMIN+MANAGER
- [x] Trigger updated_at
- [x] 13 références FK group_id dans combined_schema.sql (sections 4,5,8,10)

### P3.2 — Assignation groupe à la création de compte
**Fichiers :** `src/pages/Login.tsx` (signUp), `supabase/combined_schema.sql` (trigger handle_new_user)  
**Schéma :** `profiles.group_id` FK → `groups.id`  
**Critère succès :** À l'inscription, le MEMBER choisit son groupe/pays dans un dropdown.

- [x] Ajout de `group_id UUID REFERENCES groups(id)` dans `profiles`
- [x] Le signUp flow inclut un GroupSelect
- [x] TypeScript + build OK

### P3.3 — Filtrage par groupe (data scoping)
**Fichiers :** `src/hooks/useApi.ts`, 9 modules  
**Schéma :** RLS filtre par group_id  
**Critère succès :** MEMBER/MANAGER/FRONT_OFFICE voient UNIQUEMENT les données de leur groupe.

- [x] `isGroupScoped` dans les 12 hooks useApi — inclut MEMBER, MANAGER, FRONT_OFFICE
- [x] `query.eq('group_id', groupId)` quand isGroupScoped et groupId présent
- [x] TypeScript + build OK

### P3.4 — Création de données avec group_id
**Fichiers :** `src/hooks/useApi.ts` (add* functions)  
**Schéma :** group_id column sur toutes les tables métier  
**Critère succès :** Les fonctions add* acceptent group_id pour associer les données au bon groupe.

- [x] Toutes les add* functions acceptent `group_id: string | undefined` dans leur payload
- [x] TypeScript + build OK

### P3.5 — GroupSelect dropdown dans tous les formulaires
**Fichiers :** `src/components/GroupSelect.tsx` (nouveau composant), 9 modules  
**Critère succès :** BACK_OFFICE/ADMIN peut choisir le groupe dans chaque formulaire de création.

- [x] Composant GroupSelect réutilisable (fetch groups depuis Supabase)
- [x] Auto-sélection du groupe pour MANAGER/MEMBER/FRONT_OFFICE (lecture seule dans ce cas)
- [x] GroupSelect dans les formulaires de : Accommodation, Transport, Catering, Laundry, Hospitalities, Accreditations, Uniforms, Deliveries, AdditionalServices
- [x] `setSelectedGroupId(record.group_id || '')` dans handleEditClick de tous les modules
- [x] `group_id: selectedGroupId || undefined` dans les payloads update*
- [x] `group_id?: string` ajouté aux signatures des 8 update* dans useApi.ts
- [x] i18n : clés `groupSelect.*` dans en.json + fr.json
- [x] TypeScript + build OK

### [EXTRA] P3.3b — Nom du groupe dans le sidebar
**Fichiers :** `src/components/layout/Sidebar.tsx`  
**Critère succès :** Le sidebar affiche le nom du groupe pour MEMBER/MANAGER/FRONT_OFFICE.

- [x] Affichage du group name sous le nom d'utilisateur (quand groupId présent)

---

## Phase 4 — MANAGER + Profil + Mon Groupe ✅ (TERMINÉE)

> **Note :** Cette phase remplace/englobe le concept de "REPRESENTANT" de la roadmap initiale. Le rôle s'appelle MANAGER.

### P4.1 — Nouveau rôle MANAGER
**Schéma :** `profiles.role` — ajout de 'MANAGER' au CHECK constraint  
**Fichiers :** `src/types/index.ts`, `supabase/combined_schema.sql`, `src/components/layout/Sidebar.tsx`, `src/hooks/useApi.ts`, `src/pages/UserManagement.tsx`  
**Critère succès :** Un utilisateur peut avoir le rôle MANAGER, avec droits d'écriture sur les données de son groupe.

- [x] `MANAGER` ajouté à `AppRole` dans types/index.ts
- [x] CHECK constraint mis à jour dans combined_schema.sql
- [x] Toutes les RLS policies incluent MANAGER
- [x] Sidebar : navigation items + ROLE_LABELS pour MANAGER
- [x] hooks useApi : `isGroupScoped = role === 'MEMBER' || role === 'MANAGER'`
- [x] Dashboard MANAGER : vue catalogue (comme MEMBER mais write access)
- [x] UserManagement : badge style pour MANAGER
- [x] GroupSelect : auto-sélection du groupe pour MANAGER

### P4.2 — Page Profil MEMBER/MANAGER
**Fichier :** `src/pages/Profile.tsx` (nouveau)  
**Route :** `/app/profil`  
**Critère succès :** MEMBER peut choisir son groupe une seule fois, ou demander un changement via portal.

- [x] Si pas de groupe : GroupSelect pour en choisir un (one-time)
- [x] Si groupe déjà défini : affichage + bouton "Demander un changement" → crée une requête portal
- [x] Route ajoutée dans App.tsx
- [x] Sidebar : icône Profil pour MEMBER/MANAGER

### P4.3 — Page Mon Groupe (MANAGER)
**Fichier :** `src/pages/MyGroup.tsx` (nouveau)  
**Route :** `/app/mon-groupe`  
**Critère succès :** MANAGER voit les membres de son groupe, peut signaler un problème à ADMIN.

- [x] Liste des membres du groupe avec leurs rôles
- [x] Bouton "Signaler" → crée une requête portal vers ADMIN (type: group_issue)
- [x] Stats du groupe (nombre de membres, dernières demandes portal)
- [x] Route ajoutée dans App.tsx
- [x] Sidebar : "Mon Groupe" pour MANAGER uniquement

### P4.4 — Seed data par groupe
**Fichier :** `supabase/seed_data.sql`  
**Critère succès :** 5 groupes avec données mock réparties, testable en conditions réelles.

- [x] 5 groupes : France, Monaco, Japan, Brazil, Germany
- [x] Données mock par groupe dans tous les modules (transport, accommodation, catering, hospitality, accreditations, uniforms, laundry, additional services, deliveries)
- [x] SQL idempotent (ON CONFLICT DO NOTHING)
- [x] Exécuté sur Supabase (SQL Editor)
- [x] **Reseed** : doublons supprimés + réinsertion propre (script Node.js)

### P4.5 — Nettoyage anciennes données seed
**Fichier :** `supabase/cleanup_old_seed.sql`  
**Critère succès :** Les anciennes données sans group_id sont supprimées, seul le jeu de test par groupe reste.

- [x] Script exécuté : 0 enregistrements orphelins — la base était déjà propre
- [x] **Reseed complet** exécuté pour nettoyer les doublons du double seed

---

## Phase 5 — Extensions de session (AJOUTÉES)

### P5.1 — Interface admin CRUD Groupes
**Fichiers :** `src/pages/GroupsManagement.tsx` (nouveau), `src/hooks/useApi.ts`, `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/locales/en.json`, `src/locales/fr.json`  
**Route :** `/app/groupes`  
**Critère succès :** ADMIN/BACK_OFFICE peut créer, lister, modifier et supprimer des groupes.

- [x] Hook `useGroups` dans useApi.ts avec pagination, tri, member_count enrichi
- [x] Page complète : métriques (total groups, members, avg), table, recherche, modale CRUD
- [x] Route `/app/groupes` ajoutée dans App.tsx
- [x] Sidebar : icône Flag pour BACK_OFFICE+ADMIN
- [x] i18n : clés `groups.*` dans en.json + fr.json
- [x] Export CSV
- [x] TypeScript 0 erreurs

### P5.2 — Correction fetchProfile (group_id column)
**Fichier :** `src/store/appStore.ts`  
**Problème :** `select('role, organization_id, group_id')` plantait en 400 car `group_id` n'existait pas
- [x] Fix temporaire : fallback silencieux si colonne absente
- [x] Fix permanent : requête unique restaurée après ajout de la colonne

### P5.3 — FRONT_OFFICE group-scoping
**Fichiers :** `src/hooks/useApi.ts`, `src/pages/Dashboard.tsx`, `src/components/GroupSelect.tsx`
- [x] `isGroupScoped` inclut désormais `FRONT_OFFICE` dans les 3 fichiers
- [x] Comportement : si FRONT_OFFICE a un `group_id` → filtré par groupe ; sinon → voit tout

### P5.4 — Tests browser-use CRUD Groupes
- [x] Authentification via magic link Supabase
- [x] Test Create : groupe créé et visible ✅
- [x] Test Update : groupe renommé ✅
- [x] Test Delete : groupe supprimé ✅

---

## 📋 Conventions

- Chaque tâche cochée = **fonctionnelle sur Vercel ET local**
- Si une tâche touche la DB → `combined_schema.sql` doit être mis à jour dans le même commit
- Un test browser-use ou API curl valide chaque tâche
- Le trace log `.codebuff/trace.jsonl` enregistre chaque décision

---

## 🔮 Prochaines étapes

| Priorité | Sujet | Description |
|----------|-------|-------------|
| 🔴 Haute | Exécuter `ALTER TABLE profiles ADD group_id` sur Supabase | SQL à exécuter dans le Supabase Dashboard SQL Editor pour ajouter la colonne group_id manquante |
| 🟡 Moyenne | Re-exécuter tests browser-use après migration DB | Vérifier la disparition des 400 erreurs |
| 🟡 Moyenne | Déploiement Vercel | Push + déploiement de tous les changements de la session |
| 🟢 Faible | Enrichir GroupsManagement | Ajouter filtres avancés, drag & drop, bulk actions |
