# ICS Collaborative Map Routes

This folder contains the dedicated backend route surface for the collaborative ICS map tool.

Primary entry:
- `index.ts`: session creation, join, snapshot, deltas, mutations, locks, participant listing, operational period updates, and session end

Database schema for this feature remains in the shared migrations directory:
- `backend/postgres/migrations/005_collaborative_ics_map.sql`
