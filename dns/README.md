# DNS

**Zone(s):** naveed.io
**DNS:** Cloudflare (moved 2026-10-07). **Registrar:** Namecheap. **Transfer to Cloudflare Registrar:** **yes, before it expires on 2026-11-26** (see DOMAINS.md)

`dnsconfig.js` in this folder is the complete, authoritative record set. Every
record change goes through it and DNSControl, including verification records.
Do not add records in the Cloudflare dashboard (the next push deletes anything
this file does not list) and do not use the Namecheap DNS screens at all:
Namecheap no longer serves this zone.

## Changing a record

```bash
set -a; source ~/.config/dnscontrol/env; set +a   # CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
dnscontrol preview --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json
dnscontrol push    --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json
```

Always preview first and read the diff. Cloudflare changes records one at a
time, so a push touches only what the preview lists.

## Verifications and mail

Google Search Console, Apple, Postmark DKIM and Return-Path, Google Workspace:
each one gives you a TXT, CNAME or MX value. Add it to `dnsconfig.js` with a
comment saying what it is for, push, then press Verify in that service. Keep
the record afterwards; most services re-check it.

## Proxy and TLS

Every record is DNS-only (grey cloud). The app's host (Fly.io or GitHub Pages)
issues its own TLS certificate and needs to see traffic directly to do that.
The certificate stays with the host: a new hostname still needs
`fly certs add <host>` or the repo's Pages CNAME setting, plus its record here.

## Registrar transfer

The list of every domain, its expiry and whether it moves to Cloudflare
Registrar is in `~/dev/naveed-io/dns/DOMAINS.md`. Update it when this domain's
status changes.
