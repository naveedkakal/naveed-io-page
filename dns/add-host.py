#!/usr/bin/env python3
"""Add one record to the naveed.io zone without disturbing anything else.

Why this exists: dnsconfig.js has never been pushed (see its header). Namecheap's
only write, setHosts, replaces the whole host set, and a DNSControl push would flip
the zone's EmailType from FWD to MX, which is what keeps Naveed's email forwarding
alive. So records are added by hand, and this is the careful hand:

  1. read the live host set fresh (getHosts), including the zone's EmailType
  2. append exactly one record
  3. write it back with the SAME EmailType (the forwarding MX and SPF are not host
     records; Namecheap regenerates them from EmailType=FWD)
  4. read it back and check: same EmailType, same records plus the new one

Dry run by default. Nothing is written without --write.

  set -a; source ~/.config/dnscontrol/env; set +a
  python3 dns/add-host.py spitball CNAME naveedkakal.github.io.          # plan
  python3 dns/add-host.py spitball CNAME naveedkakal.github.io. --write  # apply

Afterwards, check what is serving (it can lag the API by a few minutes):
  dig +short CNAME <name>.naveed.io @dns1.registrar-servers.com
  dig +short MX naveed.io @dns1.registrar-servers.com    # five eforward hosts, never empty
Then add the record to dns/dnsconfig.js so the file stays a true description.
"""
import os, sys, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

SLD, TLD, TTL = 'naveed', 'io', '1799'
NS = {'nc': 'http://api.namecheap.com/xml.response'}
API = 'https://api.namecheap.com/xml.response'


def call(command, extra, post=False):
    ip = urllib.request.urlopen('https://api.ipify.org', timeout=20).read().decode().strip()
    params = {'ApiUser': os.environ['NAMECHEAP_API_USER'], 'ApiKey': os.environ['NAMECHEAP_API_KEY'],
              'UserName': os.environ['NAMECHEAP_API_USER'], 'ClientIp': ip,
              'Command': command, 'SLD': SLD, 'TLD': TLD, **extra}
    data = urllib.parse.urlencode(params)
    req = urllib.request.Request(API, data=data.encode(), method='POST') if post else urllib.request.Request(API + '?' + data)
    root = ET.fromstring(urllib.request.urlopen(req, timeout=60).read().decode())
    errs = [e.text for e in root.findall('.//nc:Error', NS)]
    if root.get('Status') != 'OK' or errs:
        sys.exit(f'{command} failed: {errs or root.get("Status")} (is {ip} on the API whitelist?)')
    return root


def read_zone():
    res = call('namecheap.domains.dns.getHosts', {}).find('.//nc:DomainDNSGetHostsResult', NS)
    hosts = [{k: h.get(k) for k in ('Name', 'Type', 'Address', 'TTL', 'MXPref')} for h in res.findall('nc:host', NS)]
    return res.get('EmailType'), hosts


def key(h):
    return (h['Name'], h['Type'], h['Address'])


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    name, rtype, address = sys.argv[1:4]
    write = '--write' in sys.argv
    if rtype in ('CNAME', 'ALIAS') and not address.endswith('.'):
        sys.exit('CNAME targets need a trailing dot, or the zone origin gets appended.')

    email_type, hosts = read_zone()
    if not email_type:
        sys.exit('getHosts returned no EmailType; refusing to write.')
    if any(h['Name'] == name for h in hosts):
        sys.exit(f'{name} already has a record; this script only adds.')

    new = {'Name': name, 'Type': rtype, 'Address': address, 'TTL': TTL, 'MXPref': '10'}
    rows = hosts + [new]
    print(f'naveed.io  EmailType={email_type}  {len(hosts)} records + 1 = {len(rows)}')
    for h in rows:
        print(f'  {"+" if h is new else " "} {h["Type"]:5} {h["Name"]:40} {h["Address"][:50]}')
    if not write:
        print('\nDry run. Nothing was written. Add --write to apply.')
        return

    params = {'EmailType': email_type}
    for i, h in enumerate(rows, 1):
        params.update({f'HostName{i}': h['Name'], f'RecordType{i}': h['Type'],
                       f'Address{i}': h['Address'], f'TTL{i}': h['TTL']})
        if h['Type'] in ('MX', 'MXE'):
            params[f'MXPref{i}'] = h['MXPref']
    res = call('namecheap.domains.dns.setHosts', params, post=True).find('.//nc:DomainDNSSetHostsResult', NS)
    if res is None or res.get('IsSuccess') != 'true':
        sys.exit('setHosts did not report success. Read the zone before trying again.')

    after_type, after = read_zone()
    added = {key(h) for h in after} - {key(h) for h in hosts}
    lost = {key(h) for h in hosts} - {key(h) for h in after}
    print(f'\nwritten. EmailType {email_type} -> {after_type}; added {sorted(added)}; lost {sorted(lost) or "nothing"}')
    if after_type != email_type or lost or added != {key(new)}:
        sys.exit('READ-BACK MISMATCH. Check the zone and mail now.')
    print('read-back matches. Now dig the record and the MX (see the top of this file).')


if __name__ == '__main__':
    main()
