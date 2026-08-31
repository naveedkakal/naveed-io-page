// DNS as code for naveed.io — managed with DNSControl.
//
// *** NOT PUSHED, AND NOT TO BE PUSHED WITHOUT A DECISION. ***
//
// This file is a verified record of the naveed.io zone, complete with the six
// records the Namecheap API cannot see, ready for the day the zone is adopted.
// It has never been pushed. Nothing has ever managed this zone: every record
// below is live because it was put there by hand, not because anything applied
// this file. Read it as a description of a zone awaiting adoption, not as a
// description of a managed one.
//
// The `misra` CNAME is the clearest case — it was added by hand (Naveed,
// 2026-08-26) precisely so this file would not have to be pushed.
//
// The reason is in the mail section below. Declaring MX explicitly sets
// Namecheap's EmailType to MX, and that flag is what turns his personal email
// forwarding on. Whether forwarding survives with the eforward hosts as plain
// MX is not knowable from here, and it fails by bouncing mail silently.
// DNSControl also warns that the namecheap provider does not reliably support
// NO_PURGE, so the seatbelt further down is not one.
//
// Before any future push: re-read the zone both ways (the file says how), and
// confirm with Namecheap that EmailType=MX keeps forwarding working.
//
//   dnscontrol --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json preview
//   dnscontrol --config dns/dnsconfig.js --creds ~/.config/dnscontrol/creds.json push
//
// ALWAYS preview first. Namecheap's API has no partial update: every push
// replaces the domain's entire host-record set.
//
// ---------------------------------------------------------------------------
// THIS FILE LIVES HERE BECAUSE THIS REPO OWNS THE ZONE.
//
// It was written in ~/dev/misra/dns/dnsconfig.js, which declared the entire
// naveed.io zone in order to add one CNAME. That was the wrong home and it is
// why this file moved (2026-08-31). misra's copy is now a pointer comment.
//
// naveed.io is Naveed's personal utility zone. Besides the site at the apex it
// carries fifteen project subdomains, a Google site verification, the Postmark
// DKIM and bounce records that other projects' senders depend on, and his
// personal email forwarding. A repo that owns one subdomain here should never
// be the thing declaring all of it.
//
// mh-handcraft/dns/dnsconfig.js has a `D("naveed.io", ...)` block deliberately
// left COMMENTED OUT, with a warning saying why. It must stay that way. Two
// files declaring one zone means whoever pushes last silently deletes whatever
// the other declared.
//
// ---------------------------------------------------------------------------
// SIX RECORDS BELOW ARE INVISIBLE TO THE API AND WERE RECONSTRUCTED FROM `dig`.
//
// Namecheap serves email forwarding behind a separate `EmailType` flag rather
// than as host records, so `get-zones` returns neither the five eforward MX nor
// the forwarding SPF. Read on 2026-08-26:
//
//     get-zones : 24 records, zero MX, one TXT
//     dig       : 5 MX (eforward1-5), 2 TXT (SPF + Google verification)
//
// A config built from get-zones alone would preview as "1 correction, CREATE"
// and destroy his personal email forwarding on the push. They are declared
// explicitly here so the record set is complete however Namecheap resolves the
// EmailType flag.
//
// Re-check both before every push. They disagree in both directions:
//   did my write land?          -> get-zones
//   what is serving right now?  -> dig @dns1.registrar-servers.com
//
//     dig MX naveed.io @dns1.registrar-servers.com
//     dig TXT naveed.io @dns1.registrar-servers.com

var REG_NAMECHEAP = NewRegistrar("namecheap");
var DSP_NAMECHEAP = NewDnsProvider("namecheap");

// The zone already serves 1799. DNSControl defaults to 300, which rewrites the
// TTL of all 24 existing records and turns a one-record change into a 31-line
// diff -- noise that hides the thing being reviewed.
DEFAULTS(DefaultTTL(1799));

// GitHub Pages apex. Four A records, all four required.
var GHP = ["185.199.108.153", "185.199.109.153",
           "185.199.110.153", "185.199.111.153"];

D("naveed.io", REG_NAMECHEAP, DnsProvider(DSP_NAMECHEAP),
  NO_PURGE,   // SEATBELT. Refuses to delete anything not listed here. Keep it
              // on: this file was assembled from two disagreeing read paths on
              // a zone nothing has ever managed, and a record missed by both is
              // a record this file does not know about.

  // ---- apex: GitHub Pages ------------------------------------------------
  A("@", GHP[0]),
  A("@", GHP[1]),
  A("@", GHP[2]),
  A("@", GHP[3]),
  CNAME("www", "naveedkakal.github.io."),

  // ---- mail: INVISIBLE TO get-zones, read from dig ------------------------
  // Namecheap email forwarding for Naveed's personal address. Load-bearing.
  MX("@", 10, "eforward1.registrar-servers.com."),
  MX("@", 10, "eforward2.registrar-servers.com."),
  MX("@", 10, "eforward3.registrar-servers.com."),
  MX("@", 15, "eforward4.registrar-servers.com."),
  MX("@", 20, "eforward5.registrar-servers.com."),
  TXT("@", "v=spf1 include:spf.efwd.registrar-servers.com ~all"),

  TXT("@", "google-site-verification=yZj00p0HgkOlxhyguSpqLv6EtJh1jeNO_UuDnjchmx0"),

  // ---- Postmark outbound -------------------------------------------------
  // misra sends as misra@outbound.naveed.io, so these two are misra's
  // deliverability as much as anything else's.
  TXT("20260603205726pm._domainkey.outbound", "k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbgz6v0oJegoSYDatEz2r53dn9q/NHrPHgfvTz2sEjJ9Lzy6P03JFa3WjE5+hW4vZzZNljHmv2g0sjoDOV0RNsrhpD8BAGavWH2cXZkUyqWZdvK1bWsyBchioZtX5nAsxuZ0O9zlmnyula4Sb9eRtxuSyQQjgvd3PRx++OCjeBEwIDAQAB"),
  CNAME("pm-bounces.outbound", "pm.mtasv.net."),

  // ---- Fly.io apps -------------------------------------------------------
  CNAME("misra", "misra.fly.dev."),          // added by hand 2026-08-26
  CNAME("mf", "mflaundry.fly.dev."),
  CNAME("mh", "mh-handcraft.fly.dev."),
  CNAME("miscolored", "miscolored.fly.dev."),
  CNAME("mispronounced", "mispronounced.fly.dev."),
  CNAME("hushbin", "53qd5zx.blinkpad.fly.dev."),
  CNAME("weave", "9lo08zx.weave-laundry-web.fly.dev."),

  // `ads` (A 66.241.124.103 / AAAA 2a09:8280:1::11e:72cb:0) was dropped from
  // this file on 2026-08-31: the vigil-ads demo it served was torn down and
  // both Fly apps are being destroyed. The two records are still LIVE in the
  // zone — deleting them here does not delete them from the internet, and
  // NO_PURGE means a push will not either. They have to be removed by hand,
  // or by turning NO_PURGE off with the rest of this file verified first.

  // ---- GitHub Pages projects ---------------------------------------------
  CNAME("avalanche", "naveedkakal.github.io."),
  CNAME("carwash", "naveedkakal.github.io."),
  CNAME("cinderella", "naveedkakal.github.io."),
  CNAME("glow", "naveedkakal.github.io."),
  CNAME("harry", "naveedkakal.github.io."),
  CNAME("mastel", "naveedkakal.github.io."),
  CNAME("tv", "naveedkakal.github.io."),
  CNAME("xfm", "naveedkakal.github.io.")
);
