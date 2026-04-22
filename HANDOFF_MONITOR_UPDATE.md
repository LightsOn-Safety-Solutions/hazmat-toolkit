# Handoff Monitor & Infrastructure Update

**Last Updated:** April 22, 2026

## Active Services & Monitoring

### Supabase (domebvsyhexhgvsducbm)
- **Role:** PostgreSQL database, Edge Functions, real-time notifications
- **Status:** ✅ Active
- **Key Features:**
  - Database migrations for schema changes
  - Trigger-based notifications for trainer submissions
  - Edge Functions for external integrations

### Render Deployment
- **Services:**
  - `hazmat-toolkit-api` - Fastify REST API (auto-deploys from git push to main)
  - `ics-collaborative-map` - Static site for specialty kit finder
- **Build Config:** `render.yaml` at repository root
- **Key Setup:**
  - API auto-builds on git push: `npm ci && npm run build`
  - API health check: `GET /health`
  - Environment variables synced for secrets (DATABASE_URL, SUPABASE_URL, etc.)

### iOS App Configuration
- **Project:** `/Volumes/Crucial X9/toolbox-site/native-ios/App.xcodeproj`
- **Target:** HazmatToolkitIOS (trainer app)
- **Info.plist:** Configure API endpoints and credentials
- **Deployment:** Via Apple Developer account

---

## Feature: Air Monitor Sampling Mode Configuration

### Overview
Trainers can configure how the Air Monitor readings are adjusted per zone using "feather percent" (0-100% reduction) applied to different sampling bands (high, low). This allows simulation of varying sensor sensitivity across the 5 Air Monitor channels: O2, LEL, CO, H2S, PID.

### Formula
```
adjustedReading = baseReading * (1 - featherPercent / 100)
```
- Feather percent = 0: No adjustment (100% of base reading)
- Feather percent = 50: 50% reduction (reading drops to 50% of base)
- Feather percent = 100: Complete suppression (0% of base reading)

---

## Database Schema Changes

### Migration: `018_add_air_monitor_sampling_modes.sql`
**Status:** ✅ Applied (May 22, 2026)

Added 20 new nullable columns to `geo_sim_shapes` table for 5 channels × 2 sampling bands (high, low):

```sql
-- Oxygen
oxygen_high_sampling_mode text
oxygen_high_feather_percent numeric
oxygen_low_sampling_mode text
oxygen_low_feather_percent numeric

-- LEL
lel_high_sampling_mode text
lel_high_feather_percent numeric
lel_low_sampling_mode text
lel_low_feather_percent numeric

-- Carbon Monoxide
carbon_monoxide_high_sampling_mode text
carbon_monoxide_high_feather_percent numeric
carbon_monoxide_low_sampling_mode text
carbon_monoxide_low_feather_percent numeric

-- Hydrogen Sulfide
hydrogen_sulfide_high_sampling_mode text
hydrogen_sulfide_high_feather_percent numeric
hydrogen_sulfide_low_sampling_mode text
hydrogen_sulfide_low_feather_percent numeric

-- PID
pid_high_sampling_mode text
pid_high_feather_percent numeric
pid_low_sampling_mode text
pid_low_feather_percent numeric
```

---

## Backend API Changes

### File: `backend/postgres/api/src/routes/scenarios.ts`
**Commits:**
- `d2b230b` - Add sampling mode parameter handling with proper SQL INSERT/UPDATE
- `913a003` - Remove debug logging (included with iOS fixes)

### Changes Made:

#### 1. TypeScript DTOs (`ShapeBody`)
Added 20 optional camelCase fields matching the UI form:
- `oxygenHighSamplingMode?: string`
- `oxygenHighFeatherPercent?: number`
- (and 18 more for all 5 channels × 2 bands)

#### 2. Database Row Types (`ShapeRow`)
Added 20 optional snake_case fields for Postgres columns

#### 3. SQL Statements
- **insertShapeSQL**: All 20 columns added to VALUES clause
- **insertShapeWithIDSQL**: All 20 columns added to VALUES clause  
- **updateShapeSQL**: All 20 parameters with proper indices and type casts (::numeric)
- **normalizePercent()** helper: Clamps feather percent to 0-100 range

#### 4. Data Mapping
- **normalizeShapeBody()**: Handles both snake_case and camelCase input fields
- **mapShapeRow()**: Converts database snake_case columns back to camelCase response

### Key API Contract
Request payload (from iOS):
```json
{
  "lelHighSamplingMode": "high",
  "lelHighFeatherPercent": 50.0,
  "lelLowSamplingMode": null,
  "lelLowFeatherPercent": null,
  ...
}
```

Response payload (to iOS):
```json
{
  "lelHighSamplingMode": "high",
  "lelHighFeatherPercent": 50,
  "lelLowSamplingMode": null,
  "lelLowFeatherPercent": null,
  ...
}
```

---

## iOS Trainer App Changes

### File: `native-ios/App/HazmatToolkitIOS/Models/GeoSimShape.swift`
**Status:** ✅ Complete

Added 20 optional properties for Codable compliance:
```swift
var oxygenHighSamplingMode: String?
var oxygenHighFeatherPercent: Double?
var oxygenLowSamplingMode: String?
var oxygenLowFeatherPercent: Double?
// ... (and 16 more)
```

Updated:
- Initializer parameters
- CodingKeys enum
- init(from decoder:) - custom decoding with fallbacks
- encode(to encoder:) - proper encoding

### File: `native-ios/App/HazmatToolkitIOS/Views/EditScenarioView.swift`
**Commits:**
- Previous session - Initial UI implementation
- `913a003` - **FIX:** Remove incorrect resetSamplingModesForNewPolygon() call after save

#### State Variables (30 total)
For each of 5 channels × 2 bands:
```swift
@State private var lelHighEnabled = false
@State private var lelHighFeatherPercent = "0"
@State private var lelLowEnabled = false
@State private var lelLowFeatherPercent = "0"
// ... (and 26 more)
```

#### UI Components
- **samplingModeSection()** ViewBuilder: 
  - Shows toggle for each sampling band (high/low)
  - Conditional TextField for feather percent when enabled
  - onChange handler validates 0-100 range
  
- **High Sampling Section:** Contains 5 channel configurations
- **Validation:** validateAndClampFeatherPercent() enforces 0-100 numeric range

#### Save Button Handler
- Constructs parameters: `lelHighEnabled ? "high" : nil` for mode, `lelHighEnabled ? Double(lelHighFeatherPercent) : nil` for percent
- Passes all 20 parameters to store methods
- **CRITICAL FIX (Commit 913a003):** Removed `resetSamplingModesForNewPolygon()` call after successful save
  - This was causing values to clear in UI immediately after save
  - Function should only be called on Cancel or when starting new polygon

#### Edit Mode Loading
**beginEditingShapeFromMap()** function:
- Loads sampling mode values from database shape object
- Sets toggles based on whether sampling_mode is nil: `lelHighEnabled = shape.lelHighSamplingMode != nil`
- Formats feather percent as string: `String(format: "%.0f", $0) ?? "0"`

### File: `native-ios/App/HazmatToolkitIOS/Core/AppStore.swift`
**Status:** ✅ Complete (debug logging removed in commit 913a003)

#### Method Signatures
Extended both methods with 20 additional optional parameters:

```swift
func addPolygonShape(
    to scenarioID: UUID,
    description: String,
    vertices: [CLLocationCoordinate2D],
    variant: EditorVariant,
    displayColorHex: String? = nil,
    chemicalReadings: [ShapeChemicalReading] = [],
    oxygenHighSamplingMode: String? = nil,
    oxygenHighFeatherPercent: Double? = nil,
    // ... (18 more parameters)
) async

func updatePolygonShape(
    id: UUID,
    description: String,
    vertices: [CLLocationCoordinate2D],
    variant: EditorVariant,
    displayColorHex: String? = nil,
    chemicalReadings: [ShapeChemicalReading] = [],
    oxygenHighSamplingMode: String? = nil,
    oxygenHighFeatherPercent: Double? = nil,
    // ... (18 more parameters)
) async
```

#### Implementation
- Assignment block sets shape properties: `shape.lelHighSamplingMode = lelHighSamplingMode`
- For updates, uses nil coalescing to preserve existing values: `shape.lelHighSamplingMode = lelHighSamplingMode ?? shape.lelHighSamplingMode`
- Calls repository.upsertShape() to persist to database

---

## Issue Found & Fixed

### Issue: Values Clearing to 0 After Save
**Date Discovered:** April 22, 2026
**Root Cause:** `resetSamplingModesForNewPolygon()` was being called after successful save in EditScenarioView.swift line 904

### The Bug
```swift
// WRONG - this was clearing the UI state immediately after save
if store.errorMessage == nil {
    draftPolygonVertices.removeAll()
    pendingClosedLoopVertices.removeAll()
    editingShapeID = nil
    showAirMonitorPolygonConfig = false
    newShapeName = nextZoneName
    resetSamplingModesForNewPolygon()  // ❌ CLEARS ALL VALUES TO 0
}
```

### The Fix (Commit 913a003)
Removed the `resetSamplingModesForNewPolygon()` call. This function should only be called:
1. When starting a new polygon (line 424) ✓
2. When user clicks Cancel (line 822) ✓

After save succeeds:
- Sheet closes naturally (`showAirMonitorPolygonConfig = false`)
- State variables remain in memory but are not displayed
- Next time user edits the zone, `beginEditingShapeFromMap()` loads fresh values from database

### Testing the Fix
1. Open trainer app, navigate to scenario editing
2. Create or edit an Air Monitor zone
3. Enable "LEL High Sampling" and set feather percent to 50
4. Click Save
5. ✅ Values should persist in database (not clear to 0)
6. Reload/re-open the zone to verify values were saved

---

## Deployment Status

### Recent Commits (April 22, 2026)
| Commit | Message | Status |
|--------|---------|--------|
| d2b230b | Add sampling mode configuration for Air Monitor zones | ✅ Deployed |
| 913a003 | Fix reset bug + remove debug logging | ✅ Deployed |

### Next Steps for Testing
1. **Build iOS trainer app** from updated codebase
2. **Test end-to-end:**
   - Trainer creates zone with LEL High 50% feather
   - Verify values persist in database
   - Trainer app reloads and shows saved values
3. **Verify trainee app receives values** in session snapshot
4. **Implement trainee-side feather adjustment logic** (separate work)

---

## Configuration Files Reference

### Render Configuration
**File:** `render.yaml`

```yaml
services:
  - type: web
    name: hazmat-toolkit-api
    runtime: node
    rootDir: backend/postgres/api
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: HOST
        value: 0.0.0.0
      - key: LOG_LEVEL
        value: info
      - key: CORS_ORIGIN
        value: "*"
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
```

**Auto-Deploy:** Commits to main branch trigger rebuild

### Supabase Setup
- **Project ID:** domebvsyhexhgvsducbm
- **Database:** PostgreSQL
- **Credentials:** Stored in Render environment variables
- **Migrations:** Applied manually via Supabase CLI or inline

---

## Monitoring & Troubleshooting

### Check API Status
```bash
curl https://hazmat-toolkit-api.onrender.com/health
# Expected: {"status":"ok","service":"hazmat-toolkit-api"}
```

### View Render Deployment Logs
1. Go to Render dashboard (https://dashboard.render.com)
2. Select `hazmat-toolkit-api` service
3. View "Logs" tab for build/runtime errors

### View Database Logs
1. Supabase dashboard → Project → Logs
2. Check `postgres` logs for query errors
3. Check `edge-function` logs for function errors

### Reset a Shape to Test
```sql
UPDATE geo_sim_shapes
SET 
  lel_high_sampling_mode = NULL,
  lel_high_feather_percent = NULL
WHERE id = 'shape-uuid-here';
```

---

## Future Work

### Trainee App Implementation
- [ ] Load feather percent values from session snapshot
- [ ] Apply formula when sampling band switches: `adjustedReading = baseReading * (1 - featherPercent / 100)`
- [ ] Display feathered readings in Air Monitor UI
- [ ] Test with all 5 channels and both sampling bands

### Additional Features
- [ ] Preset feather configurations (common scenarios)
- [ ] Visual indicators when feathering is active
- [ ] Import/export feather configurations between scenarios
- [ ] Batch feather percent application across multiple zones

---

## Quick Reference: File Locations

| Component | Path |
|-----------|------|
| Database Migration | `backend/postgres/migrations/018_add_air_monitor_sampling_modes.sql` |
| Backend API | `backend/postgres/api/src/routes/scenarios.ts` |
| iOS Model | `native-ios/App/HazmatToolkitIOS/Models/GeoSimShape.swift` |
| iOS UI | `native-ios/App/HazmatToolkitIOS/Views/EditScenarioView.swift` |
| iOS Store | `native-ios/App/HazmatToolkitIOS/Core/AppStore.swift` |
| Render Config | `render.yaml` |
| This File | `HANDOFF_MONITOR_UPDATE.md` |
