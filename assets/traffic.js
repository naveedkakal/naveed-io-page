(function (window, document) {
  "use strict";

  var origin = "https://naveed.io";
  var pages = {
    "/": "/",
    "/apps/carwash.html": "/apps/carwash.html",
    "/apps/hushbin.html": "/apps/hushbin.html",
    "/apps/mhbuild.html": "/apps/mhbuild.html",
    "/apps/miscolored.html": "/apps/miscolored.html",
    "/apps/mispronounced.html": "/apps/mispronounced.html",
    "/apps/misra.html": "/apps/misra.html",
    "/apps/ourworkshop.html": "/apps/ourworkshop.html",
    "/apps/petalpost.html": "/apps/petalpost.html",
    "/apps/picpost.html": "/apps/picpost.html",
    "/apps/tvcal.html": "/apps/tvcal.html",
    "/apps/weave.html": "/apps/weave.html",
    "/writing/prank-that-brought-him-back.html": "/writing/prank-that-brought-him-back.html",
    "/writing/seventeen-years-same-problem.html": "/writing/seventeen-years-same-problem.html",
    "/writing/teaching-the-condemned.html": "/writing/teaching-the-condemned.html",
    "/dice/": "/dice/",
    "/liam/": "/liam/",
    "/optioneers/": "/optioneers/"
  };
  var queue = [];

  function page() {
    return window.location.origin === origin ? pages[window.location.pathname] || null : null;
  }

  function emit(name) {
    if (typeof window.traffic === "function" && window.__trafficV1PageReady) {
      window.traffic("event", { name: name });
    } else if (queue.length < 3) {
      queue.push(name);
    }
  }

  function flush() {
    var names = queue;
    queue = [];
    names.forEach(emit);
  }

  function intent(event) {
    var link = event.target && event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (href.indexOf("mailto:") === 0) return emit("contact_started");
    if (link.target === "_blank" && /^https:\/\//.test(href)) emit("outbound_app_opened");
  }

  var label = page();
  if (!label || document.querySelector('script[data-site="naveed-io"]')) return;
  document.body.setAttribute("data-traffic-page", label);
  document.addEventListener("click", intent);
  window.addEventListener("traffic:page", flush);

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://traffic.naveed.io/assets/tracker_v1-dc626149.js";
  script.dataset.site = "naveed-io";
  script.dataset.endpoint = "https://traffic.naveed.io";
  script.dataset.page = label;
  script.dataset.pages = JSON.stringify(pages);
  script.dataset.events = "contact_started,outbound_app_opened,lcp";
  script.referrerPolicy = "no-referrer";
  document.head.appendChild(script);
})(window, document);
