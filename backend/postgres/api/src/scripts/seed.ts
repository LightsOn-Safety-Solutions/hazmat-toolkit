import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { loadConfig } from '../config.js';

async function main() {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });

  const trainerRef = process.env.SEED_TRAINER_REF?.trim() || 'trainer@example.com';
  const trainerName = process.env.SEED_TRAINER_NAME?.trim() || 'Trainer Demo';
  const scenarioName = process.env.SEED_SCENARIO_NAME?.trim() || 'Warehouse Leak Alpha';

  try {
    const result = await seedScenario(pool, { trainerRef, trainerName, scenarioName });

    console.log('Seed complete');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

type SeedParams = {
  trainerRef: string;
  trainerName: string;
  scenarioName: string;
};

async function seedScenario(pool: Pool, params: SeedParams) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trainer = await client.query<{ id: string }>(
      `
        insert into trainers (trainer_ref, display_name)
        values ($1, $2)
        on conflict (trainer_ref)
        do update set display_name = excluded.display_name
        returning id::text as id
      `,
      [params.trainerRef, params.trainerName]
    );
    const trainerID = trainer.rows[0].id;

    await client.query(
      `
        delete from scenario_sessions
        where scenario_id in (
          select id
          from scenarios
          where trainer_ref = $1
            and scenario_name = $2
        )
      `,
      [params.trainerRef, params.scenarioName]
    );

    await client.query(
      `
        delete from scenarios
        where trainer_ref = $1
          and scenario_name = $2
      `,
      [params.trainerRef, params.scenarioName]
    );

    const scenario = await client.query<{ id: string }>(
      `
        insert into scenarios (
          trainer_id,
          trainer_ref,
          scenario_name,
          detection_device,
          scenario_date,
          notes,
          center_geog,
          status,
          version
        )
        values (
          $1::uuid,
          $2,
          $3,
          'air_monitor',
          now(),
          'Seeded scenario for end-to-end testing',
          ST_SetSRID(ST_MakePoint(-95.3698, 29.7604), 4326)::geography,
          'published',
          1
        )
        returning id::text as id
      `,
      [trainerID, params.trainerRef, params.scenarioName]
    );
    const scenarioID = scenario.rows[0].id;

    await client.query(
      `
        insert into scenario_shapes (
          scenario_id,
          description,
          kind,
          sort_order,
          display_color_hex,
          geom,
          radius_m,
          oxygen,
          lel,
          carbon_monoxide,
          hydrogen_sulfide,
          pid,
          properties_json
        )
        values
          (
            $1::uuid,
            'Hot Zone',
            'polygon',
            1,
            '#FF3B30',
            ST_SetSRID(ST_GeomFromGeoJSON($2), 4326),
            null,
            '19.2',
            '18',
            '65',
            '12',
            '125',
            $3::jsonb
          ),
          (
            $1::uuid,
            'Warm Zone',
            'polygon',
            2,
            '#FF9500',
            ST_SetSRID(ST_GeomFromGeoJSON($4), 4326),
            null,
            '20.4',
            '6',
            '20',
            '3',
            '30',
            $5::jsonb
          ),
          (
            $1::uuid,
            'Drain Inlet Sample',
            'point',
            3,
            '#0A84FF',
            ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
            null,
            '20.8',
            '0',
            '0',
            '0',
            '0',
            $7::jsonb
          )
      `,
      [
        scenarioID,
        JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [-95.3706, 29.7610],
            [-95.3692, 29.7610],
            [-95.3692, 29.7599],
            [-95.3706, 29.7599],
            [-95.3706, 29.7610]
          ]]
        }),
        JSON.stringify({
          chemicalReadings: [
            { id: cryptoRandomUUID(), name: 'Oxygen', abbr: 'O2', value: '19.2', unit: '%vol' },
            { id: cryptoRandomUUID(), name: 'LEL', abbr: 'LEL', value: '18', unit: '%LEL' },
            { id: cryptoRandomUUID(), name: 'Carbon Monoxide', abbr: 'CO', value: '65', unit: 'ppm' },
            { id: cryptoRandomUUID(), name: 'Hydrogen Sulfide', abbr: 'H2S', value: '12', unit: 'ppm' }
          ]
        }),
        JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [-95.3712, 29.7615],
            [-95.3687, 29.7615],
            [-95.3687, 29.7593],
            [-95.3712, 29.7593],
            [-95.3712, 29.7615]
          ]]
        }),
        JSON.stringify({
          chemicalReadings: [
            { id: cryptoRandomUUID(), name: 'Oxygen', abbr: 'O2', value: '20.4', unit: '%vol' },
            { id: cryptoRandomUUID(), name: 'LEL', abbr: 'LEL', value: '6', unit: '%LEL' },
            { id: cryptoRandomUUID(), name: 'Carbon Monoxide', abbr: 'CO', value: '20', unit: 'ppm' },
            { id: cryptoRandomUUID(), name: 'Hydrogen Sulfide', abbr: 'H2S', value: '3', unit: 'ppm' }
          ]
        }),
        JSON.stringify({ type: 'Point', coordinates: [-95.3695, 29.7602] }),
        JSON.stringify({ pH: 5.5 })
      ]
    );

    await client.query('COMMIT');

    return {
      trainerRef: params.trainerRef,
      trainerId: trainerID,
      scenarioId: scenarioID,
      scenarioName: params.scenarioName,
      nextSteps: [
        'POST /v1/sessions with the scenarioId to create a join code and frozen snapshot',
        'Use X-Trainer-Ref header for trainer watch/start/end endpoints',
        'Use POST /v1/sessions/join to get a trainee session token'
      ]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function cryptoRandomUUID(): string {
  return randomUUID();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
