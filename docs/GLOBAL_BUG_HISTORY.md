# GLOBAL BUG HISTORY

## ID 003: Antipattern de sérialisation JSON pour données scalaires
**Module:** 2.3 Restauration
**Description:** L'implémentation de `catering_menus` groupait illégalement les montants de repas (pax, veg, vgn, gf, halal) en JSON stringifié dans la colonne SQL `title`. Cette "fainéantise architecturale" empêche l'agrégation native en base de données.
**Resolution:**
- Modification du schéma initial (`20240101000000_init_schema.sql`) pour ajouter les colonnes dures `pax_pax`, `pax_veg`, `pax_vgn`, `pax_gf`, `pax_halal`.
- Réécriture native du hook `useCateringMenus` pour utiliser ces colonnes sans parsing ni stringification.
- Politique de sécurité `catering_menus` corrigée ajoutant explicitement le rôle FRONT_OFFICE pour un accès SELECT en lecture seule.
**Statut:** CORRIGÉ

## ID 004: Système de demande d'accès manquant (Authentication Lockout)
**Module:** 1. Core (Authentification)
**Description:** L'absence de la table `access_requests` et du formulaire afférant bloquait le processus d'onboarding autonome des utilisateurs, les empêchant de réclamer des droits sur le système.
**Resolution:**
- Implémentation SQL de la table `access_requests` dans le schéma initial avec les directives RLS pour des accès non authentifiés (INSERT).
- Développement du mode `isRequestingAccess` au sein de la page `Login.tsx`.
- Injection des données de la requête dans la base via la table dédiée `access_requests` depuis le frontend.
**Statut:** [VERIFIED_REPAIRED]

## ID 005: Escalade de privilèges potentielle (Privilege Escalation Risk)
**Module:** 1. Core (Authentification)
**Description:** Le champ "Requested Role" dans le formulaire de demande d'accès constituait une faille de sécurité critique, permettant potentiellement à un utilisateur de s'octroyer des privilèges sans supervision.
**Resolution:**
- Suppression du champ de sélection de rôle dans le formulaire `Login.tsx`.
- Modification du schéma `20240101000000_init_schema.sql` pour définir une valeur par défaut (`PENDING`) pour la colonne `role` de la table `access_requests`, empêchant toute injection via le frontend. L'attribution du rôle sera gérée exclusivement par un ADMIN au moment de la validation.
**Statut:** [VERIFIED_REPAIRED]

## ID 006: Workflow Request Access inadapté et Cache Schema (Workflow Inefficiency)
**Module:** 1. Core (Authentification)
**Description:** Le workflow de "Request Access" est jugé inadapté pour une utilisation locale. La table `access_requests` introduisait une mauvaise pratique couplée à une erreur de synchronisation de cache. 
**Resolution:**
- Rollback de la table `access_requests` dans l'initialisation SQL.
- Déploiement d'un workflow de création de compte direct via `supabase.auth.signUp()` dans le composant `Login.tsx`.
- Déploiement d'un trigger local SQL (`on_auth_user_created`) pour automatiser l'insertion des nouveaux inscrits dans la table `profiles` avec un rôle sécurisé par défaut: `MEMBER`.
**Statut:** [VERIFIED_REPAIRED]

## ID 007: Authentication Redirection Failure
**Module:** 1. Core (Authentification)
**Description:** Le système ne gérait pas le token d'accès retourné par Supabase après l'inscription `signUp` en raison de l'absence du paramètre de redirection `emailRedirectTo` et de la route `AuthCallback`.
**Resolution:**
- Ajout de `options: { emailRedirectTo: \`${window.location.origin}/auth/callback\` }` dans l'appel `supabase.auth.signUp()`.
- Création du composant `AuthCallback.tsx` pour intercepter la session et rediriger l'utilisateur.
- Ajout de la route `/auth/callback` dans `App.tsx`.
**Statut:** [VERIFIED_REPAIRED]

## ID 008: Formulaire Restauration Dysfonctionnel (Timezone Shift & Cache)
**Module:** 2.3 Restauration
**Description:** Le formulaire de création/modification des menus de restauration n'était pas 100% opérationnel. La modification d'un menu existant générait un décalage de fuseau horaire (Timezone Shift) à cause de l'injection d'un objet `Date` UTC natif dans un input `datetime-local` attendant du LocalTime. De plus, les champs de requêtes pour les nouvelles colonnes `pax_*` nécessitaient validation.
**Resolution:**
- Refactorisation de `handleEditClick` dans `Catering.tsx` en instaurant un parseur "LocalTime" strict (`toLocalDatetimeString`) neutralisant le décalage UTC->Local lors du pré-remplissage.
- Vérification complète de la couverture de `Catering.tsx` et `useCateringMenus` sur les colonnes scalaires (`pax_pax`, `pax_veg`, `pax_vgn`, `pax_gf`, `pax_halal`) pour garantir l'absence de retour au format JSON stringifié.
**Statut:** [VERIFIED_REPAIRED]

## ID 009: OAuth 403 Forbidden (Google Configuration)
**Module:** 1. Core (Authentification)
**Description:** Le flux Google OAuth échouait avec une erreur 403 Forbidden lors de l'utilisation de `signInWithOAuth`, dû à un mismatch de l'URI de redirection ou au statut "Test" de l'application dans la console Google Cloud.
**Resolution:**
- Remplacement du `redirectTo` (`localhost` ou `window.location.origin`) par l'URL publique de callback de Supabase (`import.meta.env.VITE_SUPABASE_URL + '/auth/v1/callback'`) dans `Login.tsx`.
- *Rappel Utilisateur* : Vérifier que l'écran de consentement Google Cloud n'est pas en mode "Testing" (auquel cas les utilisateurs de l'appli doivent être explicitement ajoutés comme développeurs/testeurs) et vérifier les URIs de redirection autorisées (Redirect URLs) depuis le dashboard GCP.
**Statut:** [VERIFIED_REPAIRED]

## ID 010: Absence de persistance pour les affectations VIP (Local State Leak)
**Module:** 2.4 Hospitalités
**Description:** L'affectation des sièges VIP (Guest Seating) était gérée de manière éphémère via un `useState` local dans React. Aucune connexion n'était établie avec la base de données, entraînant la perte des données à chaque rechargement et empêchant le partage d'état entre les utilisateurs.
**Resolution:**
- Création de la table SQL `hospitality_guests` (colonnes : `section`, `guest`, `seat_num`) avec contraintes de clés étrangères vers `organization_id`.
- Application des règles RLS appropriées pour garantir l'isolation des données par organisation et restreindre l'édition aux rôles BACK_OFFICE et ADMIN.
- Programmation du hook métier `useHospitalityGuests` (`addGuest`, `deleteGuest`, `fetchGuests`).
- Refonte de la logique dans `Hospitalities.tsx` pour solliciter l'API, garantissant une affectation et révocation pérennes en base de données.
**Statut:** [VERIFIED_REPAIRED]

## ID 011: Auto-Admin Escalation (Privilege Escalation via fetchProfile)
**Module:** 1. Core (Authentification / Store)
**Description:** `fetchProfile()` dans `appStore.ts` auto-créait les profils manquants avec `role: 'ADMIN'` (`src/store/appStore.ts`, lignes 61-87). Tout nouvel utilisateur dont le profil n'existait pas encore (race condition avec le trigger SQL) obtenait les privilèges ADMIN. Cela contredisait le trigger SQL `on_auth_user_created` qui utilise `role: 'MEMBER'`.
**Resolution:**
- Suppression du bloc de création automatique de profil dans `fetchProfile()`.
- Remplacement par un `console.warn` et un `role: null` si le profil n'est pas trouvé.
- Le trigger SQL `on_auth_user_created` reste le seul mécanisme de création de profil.
- Les hardcodes associés (`'user@example.com'`, `'Default Organization'`) sont devenus du code mort.
**Statut:** [VERIFIED_REPAIRED]

## ID 012: Google OAuth Redirect URL Incorrect (Regression du Fix ID 009)
**Module:** 1. Core (Authentification)
**Description:** Le `redirectTo` de Google OAuth pointait vers l'URL interne de Supabase (`import.meta.env.VITE_SUPABASE_URL + '/auth/v1/callback'`) au lieu de l'URL de callback de l'application (`window.location.origin + '/auth/callback'`). Cela empêchait `AuthCallback.tsx` de gérer correctement le retour OAuth. Le fix ID 009 avait introduit cette régression en 2024.
**Resolution:**
- Remplacement de `redirectTo: \`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback\`` par `redirectTo: \`${window.location.origin}/auth/callback\`` dans `Login.tsx`.
- - *Rappel Utilisateur* : Vérifier que les URIs de redirection autorisées dans la console Google Cloud incluent `http://localhost:3000/auth/callback` (dev) et l'URL de production + `/auth/callback`.
**Statut:** [VERIFIED_REPAIRED]

## ID 013: Transport Assignment Data Corruption (handleAssignTransfer mutates time)
**Module:** 2.1 Transport
**Description:** `handleAssignTransfer` dans `Transport.tsx` concaténait les informations d'affectation dans le champ `time` VARCHAR : `transfer.time + ' (Assigned to ' + driverName + ')'`. Cela détruisait les données temporelles originales de manière irréversible.
**Resolution:**
- Ajout de la colonne `assigned_driver VARCHAR(255)` à la table `transport_transfers` via migration `20240101000002_fix_transport_schema.sql`.
- Réécriture de `handleAssignTransfer` pour écrire dans `assigned_driver` au lieu de muter `time`.
- Ajout d'un badge visuel dans les cartes de transfert affichant le conducteur assigné.
- Le bouton Assign affiche désormais "Reassign" si un conducteur est déjà affecté.
**Statut:** [VERIFIED_REPAIRED]

## ID 014: transport_transfers.time VARCHAR→TIMESTAMPTZ (Type de colonne incorrect)
**Module:** 2.1 Transport
**Description:** La colonne `transport_transfers.time` était `VARCHAR(100)` stockant des chaînes libres ("14:30", "Immediate") au lieu de `TIMESTAMP WITH TIME ZONE`. Cela empêchait les tris, requêtes et rapports temporels en base de données.
**Resolution:**
- Migration `20240101000002_fix_transport_schema.sql` : ajout de `time_new TIMESTAMPTZ`, migration des données VARCHAR existantes vers des timestamps via `(CURRENT_DATE + time::TIME)::TIMESTAMPTZ`, puis renommage.
- Mise à jour du schéma initial `20240101000000_init_schema.sql` avec le type correct.
- Changement du champ de saisie de `text` à `datetime-local` dans `Transport.tsx`.
- Affichage formaté des timestamps via `toLocaleString()` avec garde `isNaN()` pour les anciens enregistrements.
**Statut:** [VERIFIED_REPAIRED]

## ID 015: hospitality_packages.price VARCHAR→NUMERIC (Colonne de prix incorrecte)
**Module:** 2.4 Hospitalités
**Description:** La colonne `hospitality_packages.price` était `VARCHAR(100)` stockant les prix avec un préfixe `€` (ex: "€500"), empêchant les agrégations numériques (SUM, AVG) en base de données. Une fonction `parsePrice()` était nécessaire côté frontend pour extraire les nombres.
**Resolution:**
- Migration `20240101000003_fix_hospitality_price.sql` : conversion via `regexp_replace(price, '[^0-9.]', '', 'g')::NUMERIC(10,2)`.
- Suppression de `parsePrice()` dans `Hospitalities.tsx` — le prix est désormais un nombre.
- Ajout du préfixe `€` uniquement dans la couche d'affichage (`€{pkg.price || 0}`).
- Champ de saisie changé à `type="number" step="0.01"`.
**Statut:** [VERIFIED_REPAIRED]

## ID 016: Catering — Absence de validation end_time > start_time
**Module:** 2.3 Restauration
**Description:** Le formulaire de création/édition des menus acceptait `start_time >= end_time` sans validation.
**Resolution:**
- Ajout de `if (new Date(startTime) >= new Date(endTime))` avec message d'erreur dans `handleCreateMenu` et `handleUpdateMenu` de `Catering.tsx`.
**Statut:** [VERIFIED_REPAIRED]

## ID 017: Profile.role Type Mismatch (Typescript)
**Module:** 1. Core
**Description:** Le type `Profile.role` était `'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER'`, ne correspondant pas aux rôles réels de la DB (`'MEMBER' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN'`). Les castings (`as`) étaient nécessaires partout.
**Resolution:**
- Création du type `AppRole = 'MEMBER' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN'` dans `types/index.ts`.
- Mise à jour de `Profile.role` vers `AppRole`.
- Suppression du cast inutile dans `appStore.ts`.
**Statut:** [VERIFIED_REPAIRED]

## ID 018: Remplacement des `useState<any[]>()` par des types explicites
**Module:** Tous
**Description:** Les 11 hooks de `useApi.ts` utilisaient `useState<any[]>()` sans sécurité de type.
**Resolution:**
- Ajout de 11 interfaces typées pour toutes les tables modules.
- Remplacement des 11 `useState<any[]>()` par les types correspondants.
- Suppression des types morts : `Organization`, `TransportShift`, `EntityStatus`.
- Suppression de l'import inutilisé `TransportShift` dans `useApi.ts`.
**Statut:** [VERIFIED_REPAIRED]

## ID 019: Filtre organization_id manquant dans les requêtes (BUG-010)
**Module:** Tous (couche API)
**Description:** Les 11 hooks de `useApi.ts` ne filtraient pas explicitement par `organization_id` dans leurs requêtes SELECT, s'appuyant uniquement sur les politiques RLS. Cela pouvait causer du trafic réseau superflu et des fuites de données potentielles en cas d'erreur RLS.
**Resolution:**
- Ajout de `.eq('organization_id', organizationId)` dans toutes les fonctions `fetchX()` des 11 hooks.
- Ajout de gardes null (`if (organizationId)`) dans les effects pour éviter les requêtes sans contexte d'organisation.
- Utilisation du pattern `const query = supabase.from(...)...; if (orgId) query.eq(...);` pour la construction de requête.
**Statut:** [VERIFIED_REPAIRED]

## ID 020: Stale closure dans useActivityLogs (BUG-011)
**Module:** Dashboard
**Description:** Le hook `useActivityLogs` combinait le chargement initial des données et l'abonnement temps réel dans un seul `useEffect`, créant un risque de fermeture périmée (stale closure) pour la fonction `fetchLogs`.
**Resolution:**
- Séparation en deux `useEffect` distincts : un pour la récupération initiale des données avec dépendance `[]`, un pour l'abonnement temps réel avec nettoyage (`unsubscribe`).
- L'abonnement utilise toujours la mise à jour fonctionnelle de l'état (`current => ...`) pour éviter toute fermeture périmée.
**Statut:** [VERIFIED_REPAIRED]

## ID 021: ProtectedRoute — Chemins restreints extraits en constante (BUG-012)
**Module:** 1. Core
**Description:** Les chemins restreints `['/app/settings', '/app/crm']` étaient définis comme une variable locale dans le composant `ProtectedRoute`. L'ajout de nouveaux modules restreints nécessitait une modification du code du composant.
**Resolution:**
- Extraction vers une constante module `RESTRICTED_PATHS` avec `as const` en haut du fichier `ProtectedRoute.tsx`.
- Découverte et modification facilitées pour les futurs chemins restreints.
**Statut:** [VERIFIED_REPAIRED]

## ID 022: Dashboard — Valeurs statiques remplacées par données dynamiques (BUG-015 + HC-001 à HC-007)
**Module:** Dashboard
**Description:** Les cartes du tableau de bord affichaient des valeurs statiques (`0`, noms de projet en dur, texte placeholder). La section "Logistique" affichait un message d'intégration manquante.
**Resolution:**
- Remplacement du statut système statique par un indicateur dynamique (connecté/en chargement).
- Nom du projet via `VITE_APP_NAME` au lieu de `'tahiti-2027-core'`.
- Cartes "Active Shifts" et "Accommodation" connectées aux hooks réels.
- Section "Upcoming Logistics" remplacée par les données live de `useDeliveries`.
- Meilleure couverture i18n avec appels `t()` et valeurs de repli en anglais.
**Statut:** [VERIFIED_REPAIRED]

## ID 023: CSS Class Typos — Classes Tailwind invalides corrigées (BUG-013)
**Module:** 2.1 Transport, 2.5 Livraisons
**Description:** Trois classes CSS Tailwind invalides rendaient sans effet : `bg-indigo-505`, `border-blue-105`, `border-slate-205`.
**Resolution:**
- Correction de `bg-indigo-505` → `bg-indigo-500` dans `Deliveries.tsx`.
- Correction de `border-blue-105` → `border-blue-100` dans `Deliveries.tsx`.
- Correction de `border-slate-205` → `border-slate-200` dans `Deliveries.tsx`.
**Statut:** [VERIFIED_REPAIRED]

## ID 024: Deliveries — Valeurs de sites et filtres extraites en constantes (HC-011 à HC-013)
**Module:** 2.5 Livraisons
**Description:** Les 4 sites de livraison ("Main Stadium", "Olympic Village", etc.) étaient dupliqués entre le filtre et le formulaire. Le libellé du filtre `'All Sites'` était une chaîne en dur.
**Resolution:**
- Création de `DELIVERY_SITES` (tableau constant module avec `as const`) éliminant la duplication filtre/formulaire.
- Création de `ALL_SITES_LABEL` pour le libellé du filtre.
- Filtre et formulaire utilisent désormais le même tableau constant.
**Statut:** [VERIFIED_REPAIRED]

## ID 025: Accreditations — Zones extraites en constante module (HC-014)
**Module:** 2.6 Accréditations
**Description:** Le tableau `AVAILABLE_ZONES = ['1','2','3','4','5','V','S','M','P']` était défini à l'intérieur du composant, recréé à chaque rendu.
**Resolution:**
- Déplacement vers `ACCREDITATION_ZONES` en constante module avec `as const`.
- Suppression de la recréation inutile à chaque rendu.
**Statut:** [VERIFIED_REPAIRED]

## ID 026: Hospitalités — Sections de sièges extraites en constantes (HC-015)
**Module:** 2.4 Hospitalités
**Description:** Les 4 options de section de sièges ("Tribune d'Honneur", "Loge Présidentielle", etc.) étaient codées en dur dans le `<select>` du formulaire, ainsi que les sections de stade dans la visualisation de charge.
**Resolution:**
- Création de `SEAT_SECTIONS` (4 entrées avec value/label) et `STADIUM_SECTIONS` (4 entrées avec label/load/color) en constantes module.
- État initial `selectedSeatSection` utilise `SEAT_SECTIONS[0].value`.
- `<select>` et grille de stade itèrent désormais sur les constantes.
**Statut:** [VERIFIED_REPAIRED]

## ID 027: Laverie — Statuts et types de service extraits en constantes
**Module:** 2.8 Laverie
**Description:** Les 4 statuts (COLLECTED/IN_PROGRESS/READY/RETURNED) et les 4 types de service étaient codés en dur dans le filtre, le formulaire, les transitions rapides, et le rendu des badges.
**Resolution:**
- Création de `LAUNDRY_STATUSES` (value/filterLabel/formLabel), `LAUNDRY_SERVICE_TYPES`, `STATUS_FILTER_MAP`, `STATUS_BADGE_STYLES` + `DEFAULT_BADGE_STYLE`.
- Filtre réécrit avec `STATUS_FILTER_MAP[statusFilter]` (propre lookup au lieu de ifs chaînés).
- Badge CSS utilise la lookup `STATUS_BADGE_STYLES[row.status] || DEFAULT_BADGE_STYLE`.
- Formulaires et transitions utilisent les constantes.
**Statut:** [VERIFIED_REPAIRED]

## ID 028: Restauration — Types de service extraits en constante (HC-017/HC-018)
**Module:** 2.3 Restauration
**Description:** Les 5 formats de service (BUFFET, PLATED, LUNCHBOX, BANQUET, COFFEE_BREAK) étaient codés en dur dans le `<select>` du formulaire.
**Resolution:**
- Création de `CATERING_SERVICE_TYPES` (5 entrées avec value/label) en constante module.
- État initial et `<select>` utilisent désormais la constante.
**Statut:** [VERIFIED_REPAIRED]

## ID 029: Transport — Valeurs par défaut et statuts extraits (HC-019)
**Module:** 2.1 Transport
**Description:** Les valeurs `'08:00 - 16:00'` (heure de quart), `'ACTIVE'`/`'OFFLINE'` (statuts), et `'1'` (PAX) étaient des chaînes en dur dans les états et formulaires.
**Resolution:**
- Création de `TRANSPORT_SHIFT_STATUSES` (tableau constant), `DEFAULT_SHIFT_TIME`, `DEFAULT_PAX`.
- Tous les `useState`, `resetForm`, et `<select>` utilisent les constantes.
- Le toggle de statut utilise `TRANSPORT_SHIFT_STATUSES[0/1].value`.
**Statut:** [VERIFIED_REPAIRED]

## ID 030: Uniformes — Statuts, tailles et seuil de stock extraits (HC-020)
**Module:** 2.9 Uniformes
**Description:** Les statuts (HEALTHY/LOW_STOCK/OUT_OF_STOCK), les tailles par défaut `'S, M, L, XL'`, et le seuil bas `15` étaient codés en dur et dupliqués (3 fois le calcul d'auto-status, 2 fois le seuil).
**Resolution:**
- Création de `UNIFORM_STATUSES`, `DEFAULT_UNIFORM_SIZES`, `LOW_STOCK_THRESHOLD = 15`, `UNIFORM_STATUS_BADGE_STYLES`.
- Le calcul d'auto-status dans 3 fonctions utilise les constantes au lieu de `'HEALTHY'`/etc.
- Badge CSS utilise la lookup au lieu de la ternaire chaînée.
- `lowStockAlertCount` utilise `UNIFORM_STATUSES[1]` et `LOW_STOCK_THRESHOLD`.
**Statut:** [VERIFIED_REPAIRED]

## ID 031: Services Additionnels — Types et valeurs par défaut extraits (HC-021)
**Module:** 2.10 Services Additionnels
**Description:** Les 5 catégories de service, `'50'` (prix par défaut) et `'100'` (limite par défaut) étaient des chaînes en dur.
**Resolution:**
- Création de `SERVICE_TYPE_OPTIONS` (5 catégories avec value/label), `DEFAULT_SERVICE_PRICE`, `DEFAULT_LIMIT_COUNT`.
- Tous les `useState`, `resetForm`, et `<select>` utilisent les constantes.
**Statut:** [VERIFIED_REPAIRED]

## ID 032: CRM — Styles de badge de statut extraits (HC-022)
**Module:** 2.7 CRM
**Description:** Le rendu des badges de statut (ACTIVE = vert, sinon ambre) utilisait une ternaire en dur.
**Resolution:**
- Création de `CRM_STATUS_STYLES` (record avec ACTIVE) + `DEFAULT_CRM_STATUS_STYLE`.
- Badge utilise `CRM_STATUS_STYLES[item.status] || DEFAULT_CRM_STATUS_STYLE`.
**Statut:** [VERIFIED_REPAIRED]

## ID 033: Paramètres — Valeurs par défaut extraites (HC-023)
**Module:** 1. Core
**Description:** Le nom du workspace (`'Pacific Games Tahiti 2027'`), la couleur primaire (`'#4F46E5'`), et le domaine (`'portal.tahiti2027.com'`) étaient des chaînes en dur.
**Resolution:**
- Création de `DEFAULT_WORKSPACE_NAME`, `DEFAULT_PRIMARY_COLOR`, `DEFAULT_PORTAL_DOMAIN`.
- `useState` et `defaultValue` utilisent les constantes.
**Statut:** [VERIFIED_REPAIRED]

## ID 034: Hébergement — Valeurs résiduelles extraites (HC-008, HC-009, HC-024, BUG-014)
**Module:** 2.2 Hébergement
**Description:** Après les corrections BUG-014 (marge 15%) et HC-010 (prix des chambres), il restait des valeurs en dur : `120` (allotements par défaut), `4` (nombre minimal d'hôtels), `'ALL'`/`'PENDING'`/`'CONFIRMED'`/`'CHECKED_IN'` (statuts), `'Double'` (type de chambre), et les options de chambre dans le formulaire.
**Resolution:**
- Extraction du taux de marge `REVENUE_MARGIN_RATE = 0.15` (remplace `* 1.15` par `* (1 + REVENUE_MARGIN_RATE)`) — BUG-014.
- Extraction des prix de chambres dans `ROOM_PRICES` record et fonction `getRoomPrice()` simplifiée — HC-010.
- Création de `ACCOMMODATION_STATUSES`, `ACCOMMODATION_FILTERS`, `DEFAULT_ROOM_TYPE`, `DEFAULT_ACCOMMODATION_STATUS`, `ROOM_STATUS_BADGE_STYLES`.
- Les options de type de chambre sont désormais dérivées de `ROOM_PRICES` (clés réordonnées : Single→Double→Twin→Suite).
- Les boutons de filtre, le select de statut, et le badge utilisent les constantes.
**Statut:** [VERIFIED_REPAIRED]

## ID 037: Hébergement — i18n du titre + placeholder + constantes magiques retirées (HC-034, HC-035, HC-008/009/010)
**Module:** 2.2 Hébergement
**Description:** `Accommodation.tsx` utilisait encore des valeur codées en dur : titre français `"Hébergement & Allotements"`, placeholder de recherche non traduit, état initial `useState(120)`, fallback `|| 4` pour `hotelCount`, et fonction `getRoomPrice()` en `switch` renvoyant des montants magiques.
**Resolution:**
- Titre et placeholder passent par `t('accommodation.title')` et `t('accommodation.searchPlaceholder')`.
- `DEFAULT_ALLOTMENTS = 120` et `MIN_HOTEL_COUNT = 4` utilisés pour l'état initial et le fallback `hotelCount`.
- `getRoomPrice()` se base sur `ROOM_PRICES` et la marge utilise `REVENUE_MARGIN_RATE`.
**Statut:** [VERIFIED_REPAIRED]

## ID 035: Restauration — Valeurs par défaut des comptages diététiques extraites (HC-016)
**Module:** 2.3 Restauration
**Description:** Les compteurs diététiques par défaut (`'50'`, `'0'`, `'0'`, `'0'`, `'0'`) étaient codés en dur dans l'état initial et le `resetForm` de `Catering.tsx`.
**Resolution:**
- Création de `DEFAULT_DIETARY_COUNTS = { pax: '', veg: '', vgn: '', gf: '', halal: '' }` en constante module.
- Initialisation des `useState` via `DEFAULT_DIETARY_COUNTS`.
- `resetForm` utilise la constante pour réinitialiser les champs.
**Statut:** [VERIFIED_REPAIRED]

## ID 036: Uniformes / Services Additionnels — Valeurs par défaut `total`/`price`/`limit` retirées (HC-029, HC-030, HC-031, HC-032)
**Module:** 2.8 Uniformes + 2.10 Services Additionnels
**Description:** `Uniforms.tsx` utilisait `'100'` comme valeur par défaut pour `total` (état initial + reset). `AdditionalServices.tsx` utilisait `'50'` (prix) et `'100'` (limite) comme valeurs par défaut codées en dur.
**Resolution:**
- `Uniforms.tsx` : `useState('')` pour `total`, reset via `setTotal('')` (HC-029, HC-030).
- `AdditionalServices.tsx` : `DEFAULT_SERVICE_PRICE = ''` et `DEFAULT_LIMIT_COUNT = ''` (HC-031, HC-032).
**Statut:** [VERIFIED_REPAIRED]
