// DNS as code for naveed.io — managed with DNSControl, served by Cloudflare.
//
// Registrar: Namecheap (registration only). DNS: Cloudflare. Moved 2026-10-07.
// This file is the source of truth for the zone. Change records here and push:
//
//   set -a; source ~/.config/dnscontrol/env; set +a
//   dnscontrol --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json preview
//   dnscontrol --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json push
//
// ALWAYS preview first. Cloudflare updates records one at a time, so a push only
// touches what the preview lists.
//
// The registrar is declared as "none" on purpose. With a namecheap registrar here,
// a push would also rewrite the domain's nameservers at Namecheap. The nameservers
// were set once, by hand, at the cutover; this file should never touch them.
//
// ---------------------------------------------------------------------------
// THIS FILE LIVES HERE BECAUSE THIS REPO OWNS THE ZONE.
//
// naveed.io is Naveed's personal utility zone: the site at the apex, project
// subdomains, a Google site verification, and the Postmark records that other
// projects' senders depend on (misra sends as misra@outbound.naveed.io).
//
// mh-handcraft/dns/dnsconfig.js has a `D("naveed.io", ...)` block deliberately
// left COMMENTED OUT, and misra's old copy is a pointer comment. Keep it that
// way. Two files declaring one zone means whoever pushes last deletes whatever
// the other declared.
//
// ---------------------------------------------------------------------------
// MAIL. There is no inbound mail for naveed.io. On Namecheap the zone had email
// forwarding switched on (five eforward MX + their SPF) but zero forwarding
// rules (getEmailForwarding, 2026-10-07), so those records were dropped at the
// move. For an inbound address, set up Cloudflare Email Routing; it adds its
// own MX and SPF, which then need declaring here.
//
// PROXY. Every record is DNS-only (grey cloud), the DNSControl default. Fly.io
// and GitHub Pages issue their own TLS certificates and the Cloudflare proxy can
// break issuing and renewing them. Proxy a record only on purpose, per record,
// with CF_PROXY_ON.

var REG_NONE = NewRegistrar("none");
var DSP_CLOUDFLARE = NewDnsProvider("cloudflare");

// GitHub Pages apex. Four A records, all four required.
var GHP = ["185.199.108.153", "185.199.109.153",
           "185.199.110.153", "185.199.111.153"];

D("naveed.io", REG_NONE, DnsProvider(DSP_CLOUDFLARE),

  // ---- apex: GitHub Pages ------------------------------------------------
  A("@", GHP[0]),
  A("@", GHP[1]),
  A("@", GHP[2]),
  A("@", GHP[3]),
  CNAME("www", "naveedkakal.github.io."),

  TXT("@", "google-site-verification=yZj00p0HgkOlxhyguSpqLv6EtJh1jeNO_UuDnjchmx0"),

  // ---- Postmark outbound -------------------------------------------------
  // misra sends as misra@outbound.naveed.io, so these are misra's deliverability.
  TXT("_dmarc.outbound", "v=DMARC1; p=none; adkim=r; aspf=r"),
  TXT("20260603205726pm._domainkey.outbound", "k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbgz6v0oJegoSYDatEz2r53dn9q/NHrPHgfvTz2sEjJ9Lzy6P03JFa3WjE5+hW4vZzZNljHmv2g0sjoDOV0RNsrhpD8BAGavWH2cXZkUyqWZdvK1bWsyBchioZtX5nAsxuZ0O9zlmnyula4Sb9eRtxuSyQQjgvd3PRx++OCjeBEwIDAQAB"),
  CNAME("pm-bounces.outbound", "pm.mtasv.net."),

  // ---- Fly.io apps -------------------------------------------------------
  CNAME("misra", "misra.fly.dev."),
  CNAME("mf", "mflaundry.fly.dev."),
  CNAME("mh", "mh-handcraft.fly.dev."),
  CNAME("miscolored", "miscolored.fly.dev."),
  CNAME("mispronounced", "mispronounced.fly.dev."),
  CNAME("hushbin", "53qd5zx.blinkpad.fly.dev."),
  CNAME("weave", "9lo08zx.weave-laundry-web.fly.dev."),
  CNAME("clae", "claepest.fly.dev."),
  CNAME("jays", "jaysgreencare.fly.dev."),
  CNAME("rollup", "rollup.fly.dev."),
  CNAME("traffic", "naveed-traffic.fly.dev."),       // naveed.io's own visitor counter
  CNAME("earlgiles", "earlgiles.fly.dev."),
  CNAME("orchard", "orchard.fly.dev."),              // Orchard, Codewrights
  CNAME("appleorchard", "orchard.fly.dev."),         // Orchard's first host, now a redirect to orchard

  // ---- GitHub Pages projects ---------------------------------------------
  // Every name here must be claimed by a repo's Pages CNAME, or anyone can claim
  // it. glow and carwash were removed 2026-10-07 for that reason: glow-garden
  // moved to glowgardenusa.com and npv-car-washes to napervillecarwashes.com.
  CNAME("avalanche", "naveedkakal.github.io."),
  CNAME("cinderella", "naveedkakal.github.io."),
  CNAME("harry", "naveedkakal.github.io."),
  CNAME("mastel", "naveedkakal.github.io."),
  CNAME("spitball", "naveedkakal.github.io."),
  CNAME("knowthat", "naveedkakal.github.io."),
  CNAME("tv", "naveedkakal.github.io."),
  CNAME("xfm", "naveedkakal.github.io.")
);
