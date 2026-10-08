# Domains

Every domain Naveed owns, where its DNS is served, which repo owns the records,
and whether it is moving to Cloudflare Registrar. This is the reminder list:
**check the Transfer column whenever you touch DNS, and before any expiry date.**

The plan (decided 2026-10-07): DNS moves to Cloudflare zone by zone. Registration
moves to Cloudflare Registrar for every domain worth keeping, ideally when it is
next due to renew, because a transfer *is* a one-year renewal at Cloudflare's
at-cost price. Domains not worth keeping stay at Namecheap with auto-renew off and
lapse.

Last read from the Namecheap API: 2026-10-07.

| Domain | DNS | Records live in | Expires | Transfer to Cloudflare |
|---|---|---|---|---|
| naveed.io | Cloudflare | naveed-io `dns/dnsconfig.js` | **2026-11-26** | **Yes (keeping).** Target: start by 2026-11-12. A transfer takes up to ~5 days and *is* the renewal, so leave margin before the 2026-11-26 expiry. Do not let Namecheap auto-renew first |
| codewrights.io | Cloudflare | codewrights `dns/dnsconfig.js` | 2027-06-09 | Yes (business domain). Eligible now |
| picpost.io | Cloudflare | petalpost `dns/dnsconfig.js` | 2027-05-30 | **Yes (keeping).** Renew on Cloudflare: transfer any time before expiry. Eligible now |
| mispronounced.io | Cloudflare | accent-app `dns/dnsconfig.js` | 2027-07-04 | **Yes (keeping).** Renew on Cloudflare: transfer any time before expiry. Eligible now |
| napervillecarwashes.com | Cloudflare (site is a Worker, proxied) | npv-car-washes `dns/dnsconfig.js` | 2027-07-21 | **No. Lapses 2027-07-21.** Auto-renew turned off 2026-10-07 |
| spitballgame.io | Cloudflare | (dashboard) | 2027-10-07 | Keep? Registered 2026-10-07, locked until 2026-12-06 |
| glowgardenusa.com | GoDaddy (its nameservers); a Cloudflare zone exists but was never activated | glow-garden repo serves it on GitHub Pages | 2027-08-28 (registry) | Registered at **GoDaddy**, not Namecheap. Decide whether it's ours to move; if not, delete the pending Cloudflare zone |
| weave-linen.com | Namecheap | — | **2026-12-30** | Decide before 2026-12-30 |
| weave-linen.dev | Namecheap | — | 2027-01-11 | Auto-renew off; lapsing? |
| tychocore.com | Namecheap (Google mail) | — | 2027-03-26 | Auto-renew off; lapsing? |
| nazneen.io | Cloudflare | petalpost `dns/dnsconfig.js` (for now; moves with the site if it gets its own app) | 2027-03-16 | **Yes (keeping).** Transfer any time before 2027-03-16. Eligible now |
| tycholinen.com | Namecheap | — | 2027-03-23 | Decide |
| weavecmms.com | Namecheap | — | 2027-03-27 | Decide |
| petalpost.io | Namecheap | — (served by petalpost Fly app) | 2027-05-22 | **No. Let it lapse;** everything unifies under picpost.io. Turn auto-renew OFF at Namecheap (still on as of 2026-10-07). Not worth moving its DNS |
| pawpost.io | Namecheap | — (served by petalpost Fly app) | 2027-05-24 | **No. Let it lapse;** everything unifies under picpost.io. Turn auto-renew OFF at Namecheap (still on as of 2026-10-07). Not worth moving its DNS |
| potionpost.io | Namecheap | — (served by petalpost Fly app) | 2027-05-24 | **No. Let it lapse;** everything unifies under picpost.io. Turn auto-renew OFF at Namecheap (still on as of 2026-10-07). Not worth moving its DNS |
| ourworkshop.io | Namecheap | — | 2027-06-09 | Decide |
| mhbuildstudio.com | Cloudflare | mh-handcraft `dns/dnsconfig.js` | 2027-08-13 | **Yes (keeping).** Transfer any time before 2027-08-13. Eligible now (registered 2026-08-13) |

## Moving a zone's DNS to Cloudflare

1. Add the site in the Cloudflare dashboard (Free plan). The API token can edit
   every zone but cannot create one.
2. Write the repo's `dns/dnsconfig.js` with `NewDnsProvider("cloudflare")` and
   `NewRegistrar("none")`. Copy every record from the live zone
   (`dnscontrol get-zones ... namecheap <zone>`, plus `dig` for MX and TXT,
   because Namecheap hides email-forwarding records from the API).
3. Drop dead records on the way: Namecheap email forwarding that has no rules,
   CNAMEs to GitHub Pages or Fly that no repo or app claims any more.
4. `preview`, `push`, `preview` again until it reports 0 corrections.
5. `dig` every name at `dns1.registrar-servers.com` and at the Cloudflare
   nameserver and compare.
6. Switch the nameservers at Namecheap (`namecheap.domains.dns.setCustom`, or
   Domain List → Manage → Nameservers → Custom DNS).
7. When the registry shows the Cloudflare nameservers, check every host over
   HTTPS and the MX records.

## Transferring a registration to Cloudflare

1. The domain must already use Cloudflare nameservers, and be more than 60 days
   past registration or its last transfer.
2. Namecheap: make sure the domain is unlocked and get the auth (EPP) code.
3. Cloudflare dashboard → Domain Registration → Transfer Domains: pick the
   domain, enter the code, pay one year at cost. The year is added to the
   current expiry.
4. Approve the transfer from Namecheap's email to speed it up (otherwise about
   5 days). DNS keeps working throughout.
5. Update the table above.
