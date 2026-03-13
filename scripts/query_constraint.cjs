const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Unsere-Schickeria-2026@api.labs-schickeria.com:5433/labs_db'
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'agency_projects_status_check';`);
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
