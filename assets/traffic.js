(function (window, document) {
  "use strict";
  var origin = "https://naveed.io";
  var pages = {"/":"/","/apps/carwash.html":"/apps/carwash.html","/apps/hushbin.html":"/apps/hushbin.html","/apps/mhbuild.html":"/apps/mhbuild.html","/apps/miscolored.html":"/apps/miscolored.html","/apps/mispronounced.html":"/apps/mispronounced.html","/apps/misra.html":"/apps/misra.html","/apps/ourworkshop.html":"/apps/ourworkshop.html","/apps/petalpost.html":"/apps/petalpost.html","/apps/picpost.html":"/apps/picpost.html","/apps/tvcal.html":"/apps/tvcal.html","/apps/weave.html":"/apps/weave.html","/writing/prank-that-brought-him-back.html":"/writing/prank-that-brought-him-back.html","/writing/seventeen-years-same-problem.html":"/writing/seventeen-years-same-problem.html","/writing/teaching-the-condemned.html":"/writing/teaching-the-condemned.html","/dice/":"/dice/","/liam/":"/liam/","/optioneers/":"/optioneers/"};
  var label = window.location.origin === origin ? pages[window.location.pathname] || null : null;
  if (!label || document.querySelector('script[data-site="naveed-io"]')) return;
  document.body.setAttribute("data-traffic-page", label);
  var script = document.createElement("script");
  script.async = true; script.src = "https://traffic.naveed.io/tracker/v1.js"; script.dataset.site = "naveed-io"; script.dataset.endpoint = "https://traffic.naveed.io"; script.dataset.page = label; script.dataset.pages = JSON.stringify(pages); script.dataset.events = "lcp"; script.referrerPolicy = "no-referrer"; document.head.appendChild(script);
})(window, document);
