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
