(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  if (!reduced) {
    addEventListener("pointermove", function (e) {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "-6% 0px" });
  document.querySelectorAll(".rise").forEach(function (el) { io.observe(el); });

  /* click-to-copy credentials */
  document.querySelectorAll(".copyable").forEach(function (el) {
    el.addEventListener("click", function () {
      var txt = el.getAttribute("data-copy") || el.textContent;
      navigator.clipboard && navigator.clipboard.writeText(txt.trim());
      var was = el.textContent; el.textContent = "copied ✓";
      setTimeout(function () { el.textContent = was; }, 1100);
    });
  });
})();
