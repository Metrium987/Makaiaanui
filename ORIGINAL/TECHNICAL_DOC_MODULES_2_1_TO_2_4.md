# Documentation Technique - Modules Opérationnels (2.1 à 2.4)

## 2.1 Logistique & Transport
- **Tables Supabase :** `transport_shifts`, `transport_transfers`
- **Hooks API :** `useTransportShifts`, `useTransportTransfers`
- **Composant UI :** `Logistics.tsx`
- **Logique métier :** Gestion des shifts chauffeurs (Check-in/Check-out, Suivi des véhicules) et des transferts (Point A à Point B, capacité). 

## 2.2 Hébergements (Accommodation)
- **Table Supabase :** `accommodation_rooms`
- **Hooks API :** `useAccommodationRooms`
- **Composant UI :** `Accommodation.tsx`
- **Logique métier :** Attribution des chambres d'hôtels pour les délégations/invités. Gestion des statuts d'occupation et types de chambre.

## 2.3 Restauration (Catering)
- **Table Supabase :** `catering_menus`
- **Hooks API :** `useCateringMenus`
- **Composant UI :** `Catering.tsx`
- **Logique métier :** Gestion des créneaux de restauration avec une typologie précise de régimes alimentaires. Découpage scalaire des attributs diététiques (`pax_pax`, `pax_veg`, `pax_vgn`, `pax_gf`, `pax_halal`) et parsing natif `toLocalDatetimeString` pour pallier aux décalages de fuseaux horaires locaux vs UTC.

## 2.4 Hospitalités
- **Tables Supabase :** `hospitality_packages`, `hospitality_guests`
- **Hooks API :** `useHospitalityPackages`, `useHospitalityGuests`
- **Composant UI :** `Hospitalities.tsx`
- **Logique métier :** Vente et jauge des packages VIP. Affectation nominative des sièges invités avec persistance SQL (via `hospitality_guests`) partagée entre utilisateurs.

## Socle de Sécurité Transversal
- **Sécurité RLS (Row Level Security) :** Chaque ligne insérée contient la contrainte `organization_id`.
- Les politiques limitent la lecture globale aux utilisateurs rattachés (via `get_user_org()`) disposant d'un rôle `FRONT_OFFICE`, `BACK_OFFICE`, ou `ADMIN`. 
- Les écritures (Insert, Update, Delete) sont systématiquement verrouillées aux rôles supérieurs (`BACK_OFFICE`, `ADMIN`) par le bias des triggers SQL mis en place dans le module Core.
