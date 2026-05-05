Work on branch `prl-00-admin-adds-pearl`.

Task:
Implement only the frontend Admin UI for the “Admin adds a Pearl” feature.

Important context:
Prompt 1 already implemented the backend foundation:
- `GET /api/admin/pearl-owners`
- `POST /api/admin/pearl-owners`
- `POST /api/admin/pearls`
- DB migration for PearlOwner / Pearl relationship
- backend validation and tests

Do not change backend behavior in this prompt unless a tiny client-contract fix is absolutely required.

Goal:
Build the admin UI flow so an already authenticated Admin can create a new Pearl and link it to a PearlOwner.

Frontend route:
- `/admin/pearls/new`

Planned UI components:
- `AdminAddPearlPage`
- `AddPearlForm`
- `PearlOwnerSelect`

Required form fields:
- name
- story
- address
- theme
- latitude
- longitude
- PearlOwner

Allowed theme values:
- War
- Museum
- Streetart
- Food
- Culture

Required behavior:
1. Admin can open `/admin/pearls/new`.
2. Admin can fill in all required Pearl fields.
3. Admin can select an existing PearlOwner from `GET /api/admin/pearl-owners`.
4. Admin can create a new PearlOwner using `POST /api/admin/pearl-owners`.
5. Admin can submit the Pearl using `POST /api/admin/pearls`.
6. UI shows clear validation errors for missing/invalid fields.
7. UI shows backend validation errors cleanly.
8. UI shows a success state after creation.
9. UI should match the existing admin portal visual style.
10. Do not add image upload, geocoding, moderation, or public submission.

Implementation guidance:
- inspect existing admin portal components first
- reuse the existing admin API client pattern in `frontend/src/api/client.ts`
- keep TypeScript strict: no implicit `any`
- keep components small and readable
- keep styling consistent with current admin dashboard CSS
- do not redesign the admin portal
- do not implement login/auth

Testing:
Add/update frontend tests for:
- Add Pearl form renders
- existing PearlOwners are loaded
- Admin can create/select PearlOwner
- validation errors are shown for missing fields
- invalid theme/coordinates are handled
- successful Pearl creation shows success state
- API errors are shown cleanly

Documentation/traceability:
- update `docs/traceability.md` only where frontend implementation references and validation evidence need to be updated
- do not rewrite already completed governance docs

Output:
- short implementation plan before editing
- files changed
- UI route/components added
- API client functions added
- tests added
- what remains for Prompt 3

Hard rules:
- frontend only unless absolutely necessary
- no auth/login implementation
- no backend refactor
- no image upload
- no geocoding
- no moderation
- no public submission
- do not disconnect from existing admin portal style
