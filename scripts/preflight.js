import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    const rls = await client.query(`
      select relname as table
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity = false;
    `);
    if (rls.rows.length > 0) {
      console.error('Tables without RLS:', rls.rows.map(r => r.table).join(', '));
      process.exit(1);
    }
    const definer = await client.query(`
      select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and prosecdef = true;
    `);
    if (definer.rows.length > 0) {
      console.error('Security definer functions found:', definer.rows.map(r => r.proname).join(', '));
      process.exit(1);
    }
    console.log('RLS and SECURITY DEFINER checks passed');
  } catch (err) {
    console.error('Preflight check failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
