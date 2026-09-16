// Serves the field CA certificate to phones over plain HTTP so they can install
// and trust it BEFORE the HTTPS worker is reachable. Run only while onboarding
// phones, then stop it (Ctrl+C). Never serves private keys.
// Usage: node scripts/serve-field-ca.mjs   → http://<laptop-ip>:8899/
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const certs = join(dirname(fileURLToPath(import.meta.url)), '..', 'certs');
const pem = readFileSync(join(certs, 'rootCA.pem'));
const der = readFileSync(join(certs, 'rootCA.cer'));

const page = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ourTake field CA</title>
<body style="font:18px/1.6 system-ui;max-width:34em;margin:2em auto;padding:0 1em">
<h1>Install the ourTake field certificate</h1>
<p><strong>iPhone:</strong> tap <a href="/rootCA.pem">rootCA.pem</a> → Allow → Settings → Profile Downloaded → Install.
Then Settings → General → About → Certificate Trust Settings → enable full trust for <em>ourTake Field CA 2026</em>.</p>
<p><strong>Android (Pixel):</strong> tap <a href="/rootCA.cer">rootCA.cer</a> and save it. Then Settings → Security &amp; privacy →
More security settings → Encryption &amp; credentials → Install a certificate → <em>CA certificate</em> → Install anyway → pick the file.</p>
<p>This certificate only trusts this laptop's ourTake worker. Remove it after the pilot (iOS: delete the profile; Android: Trusted credentials → User).</p>`;

const server = createServer((req, res) => {
  if (req.url === '/rootCA.pem')
    return res.writeHead(200, { 'Content-Type': 'application/x-pem-file', 'Content-Disposition': 'attachment; filename="rootCA.pem"' }).end(pem);
  if (req.url === '/rootCA.cer')
    return res.writeHead(200, { 'Content-Type': 'application/x-x509-ca-cert', 'Content-Disposition': 'attachment; filename="rootCA.cer"' }).end(der);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
});
server.listen(8899, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log('Serving field CA. On each phone, open one of:');
  for (const ip of ips) console.log(`  http://${ip}:8899/`);
  console.log('Stop with Ctrl+C when all phones are done.');
});
