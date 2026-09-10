import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import pg from 'pg';
// Read only on the server. Never copy the founder's shared environment into the frontend.
const env=parseEnv(readFileSync(new URL('../../.env.local',import.meta.url),'utf8'));
const connectionString=env.CLOUD_DIRECT_URL||env.CLOUD_DATABASE_URL||env.CLOUD_SUPABASE_DB_URL;
if(!connectionString)throw new Error('No cloud database connection string found.');
const certResponse=await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt');
if(!certResponse.ok)throw new Error('Could not download the Supabase database CA certificate.');
const ca=await certResponse.text();
if(!ca.includes('BEGIN CERTIFICATE'))throw new Error('Invalid database CA response.');
const parsed=new URL(connectionString);for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])parsed.searchParams.delete(key);
const client=new pg.Client({connectionString:parsed.toString(),connectionTimeoutMillis:15000,ssl:{rejectUnauthorized:true,ca}});
try{
 await client.connect();
 await client.query('BEGIN');
 await client.query(`CREATE SCHEMA IF NOT EXISTS ourframe;
 REVOKE ALL ON SCHEMA ourframe FROM PUBLIC, anon, authenticated;
 CREATE TABLE IF NOT EXISTS ourframe.records (
   kind text NOT NULL, id text NOT NULL, session_id text, data jsonb NOT NULL,
   updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(kind,id)
 );
 CREATE INDEX IF NOT EXISTS ourframe_records_session ON ourframe.records(kind,session_id);
 ALTER TABLE ourframe.records ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON ourframe.records FROM PUBLIC, anon, authenticated;
 COMMENT ON SCHEMA ourframe IS 'OurFrame isolated pilot namespace; unrelated application data is untouched.';
 COMMENT ON TABLE ourframe.records IS 'Server-only session, member, clip, upload, and composition records. No browser role access.';`);
 await client.query('COMMIT');
 const result=await client.query("SELECT to_regclass('ourframe.records')::text AS relation");
 console.log(JSON.stringify({createdNamespace:'ourframe',relation:result.rows[0].relation,browserAccess:'revoked',existingApplicationTables:'unchanged'}));
}catch(e){try{await client.query('ROLLBACK')}catch{};console.error('Supabase provisioning failed:',e.code||e.name);process.exitCode=1}finally{await client.end()}
