# Trainer Locator Workflow

This folder contains the production-minded Trainer Locator workflow:

- Public locator: `../trainers.html`
- Trainer submission: `../trainers-submit.html`
- Super admin review: `../trainers-admin.html`

## Supabase Setup

1. Run SQL in [`sql/schema.sql`](./sql/schema.sql).
2. Copy [`config.runtime.example.js`](./config.runtime.example.js) to `config.runtime.js`.
3. Fill `supabaseUrl`, `supabaseAnonKey`, and `allowedAdminEmails`.
4. Ensure RLS update policy only allows `super_admin` users to update records.

## Data Rules

- New submissions are `pending` + `admin-only`.
- Public page only reads `approved` + `public`.
- Rejected records stay stored and can be re-approved later.
- Shared normalization and filtering logic lives in `js/trainer-schema.js` and `js/trainer-filters.js`.
