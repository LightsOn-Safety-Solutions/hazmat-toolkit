# ERG Chemical Database Management

This document explains the ERG (Emergency Response Guidebook) isolation database and how to add or update chemicals.

## Files

- **erg-isolation-data.js** - The main database file (JavaScript/JSON format)
- **erg-chemicals.csv** - CSV template for adding new chemicals
- **add-erg-chemicals.py** - Python script to update the database

## Adding Chemicals

### Method 1: Using CSV (Recommended for Bulk Additions)

1. Edit `erg-chemicals.csv` and add new rows:
   ```
   un_number,guide_number,display_name,material_names,small_isolation_m,small_day_m,small_night_m,large_isolation_m,large_day_m,large_night_m
   1203,128,Gasoline,Gasoline|Petrol,30,100,100,100,300,800
   ```

2. Run the script with CSV mode:
   ```bash
   python3 add-erg-chemicals.py --csv
   ```

### Method 2: Using Python Script (For Programmatic Addition)

Edit `add-erg-chemicals.py` and add to `MISSING_CHEMICALS`:

```python
MISSING_CHEMICALS = {
    "1203": {
        "unNumber": "1203",
        "guideNumber": "128",
        "displayName": "Gasoline",
        "materialNames": ["Gasoline", "Petrol"],
        "smallSpill": {
            "initialIsolationMeters": 30.0,
            "protectiveAction": {
                "dayMeters": 100.0,
                "nightMeters": 100.0
            }
        },
        "largeSpill": {
            "initialIsolationMeters": 100.0,
            "protectiveAction": {
                "dayMeters": 300.0,
                "nightMeters": 800.0
            }
        },
        "largeSpillOptions": []
    }
}
```

Then run:
```bash
python3 add-erg-chemicals.py
```

## Data Structure

Each chemical entry has this structure:

```json
{
  "id": "un1203",
  "unNumber": "1203",
  "guideNumber": "128",
  "displayName": "Gasoline",
  "materialNames": ["Gasoline", "Petrol"],
  "smallSpill": {
    "initialIsolationMeters": 30,
    "protectiveAction": {
      "dayMeters": 100,
      "nightMeters": 100
    }
  },
  "largeSpill": {
    "initialIsolationMeters": 100,
    "protectiveAction": {
      "dayMeters": 300,
      "nightMeters": 800
    }
  },
  "largeSpillOptions": []
}
```

### Field Definitions

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (format: `un<number>`) |
| `unNumber` | UN classification number (1203, 1098, etc.) |
| `guideNumber` | ERG guide number (128, 131, etc.) |
| `displayName` | Primary chemical name |
| `materialNames` | Array of alternate names/aliases |
| `smallSpill.initialIsolationMeters` | Small spill initial isolation distance in meters |
| `smallSpill.protectiveAction.dayMeters` | Protective action distance for day (meters) |
| `smallSpill.protectiveAction.nightMeters` | Protective action distance for night (meters) |
| `largeSpill.*` | Same as smallSpill for large spills |
| `largeSpillOptions` | Special cases or alternate scenarios |

## ERG Guide Numbers

Common guide numbers by hazard class:

- **117-122** - Toxic Gases
- **123-135** - Flammable Liquids & Gases  
- **136-140** - Oxidizers
- **141-151** - Corrosives
- **152-159** - Miscellaneous Hazardous Materials
- **160-166** - Other Hazards

## Data Sources

The isolation distances are based on:
- USDOT Emergency Response Guidebook (latest edition)
- CHEMM (Chemical Hazards Emergency Medical Management)
- HAZMAT regulations

## Verification

After adding chemicals, verify the database is valid JSON:

```bash
node -e "
const data = require('./erg-isolation-data.js');
console.log('✓ Valid JSON with', data.materials.length, 'chemicals');
"
```

## Missing Chemicals

Current gaps in the database (UN numbers not yet added):
- 1082-1091 (10 chemicals)
- 1093-1097 (5 chemicals)
- 1098-1134 (37 chemicals - partial)
- ... (many more)

See `add-erg-chemicals.py` for the complete list and add them as data becomes available.

## Future Improvements

1. **Integrate with ERG API** - When USDOT releases a machine-readable ERG database
2. **Validation** - Add schema validation for new entries
3. **Search Index** - Build full-text search for chemical names
4. **Versioning** - Track ERG guidebook version used for each entry

## Contributing

When adding chemicals:
1. Use official USDOT ERG data when possible
2. Include all alternate chemical names
3. Double-check isolation distances (small vs large spills)
4. Test with the isolation tool before committing
5. Note the ERG edition used for reference
