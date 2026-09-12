import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/traffic.js', import.meta.url), 'utf8');
function install({ origin = 'https://naveed.io', pathname = '/', ready = false } = {}) {
  const scripts = [], listeners = {}, body = { attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
  const document = {
    body, head: { appendChild(node) { scripts.push(node); } },
    querySelector(selector) { return selector === 'script[data-site="naveed-io"]' && scripts[0] ? scripts[0] : null; },
    createElement() { return { dataset: {} }; }, addEventListener(name, listener) { listeners[name] = listener; }
  };
  const window = { location: { origin, pathname }, __trafficV1PageReady: ready, addEventListener(name, listener) { listeners[name] = listener; } };
  const context = { window, document, JSON, RegExp };
  vm.runInNewContext(source, context);
  return { scripts, listeners, body, window, context };
}
const publicPage = install({ pathname: '/apps/weave.html' });
assert.equal(publicPage.scripts.length, 1);
vm.runInNewContext(source, publicPage.context);
assert.equal(publicPage.scripts.length, 1, 'repeated initialization does not append another collector');
assert.equal(publicPage.body.attrs['data-traffic-page'], '/apps/weave.html');
assert.equal(publicPage.scripts[0].dataset.events, 'contact_started,outbound_app_opened,lcp');
assert.equal(publicPage.scripts[0].src, 'https://traffic.naveed.io/assets/tracker_v1-dc626149.js');
const calls = [];
publicPage.listeners.click({ target: { closest() { return { target: '_blank', getAttribute() { return 'https://weavecmms.com'; } }; } } });
publicPage.window.traffic = (method, options) => calls.push({ method, options });
publicPage.window.__trafficV1PageReady = true;
publicPage.listeners['traffic:page']();
assert.equal(calls.length, 1);
assert.equal(calls[0].method, 'event');
assert.equal(calls[0].options.name, 'outbound_app_opened');
assert.equal(install({ origin: 'https://www.naveed.io' }).scripts.length, 0);
assert.equal(install({ pathname: '/dns/dnsconfig.js' }).scripts.length, 0);
assert.equal(install({ pathname: '/writing/unknown.html' }).scripts.length, 0);
assert.doesNotMatch(source, /location\.href|searchParams|hash|name:\s*href/);
console.log('naveed.io Traffic contract checks passed');
