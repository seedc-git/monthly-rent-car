(() => {
  "use strict";

  const page = document.querySelector(".area-ranking-page.area-tachikawa");
  const article = page?.querySelector(".ranking-article");
  if (!page || !article) return;

  let progress = page.querySelector("[data-reading-progress]");
  if (!progress) {
    const progressTrack = document.createElement("div");
    progress = document.createElement("span");
    progressTrack.className = "reading-progress";
    progressTrack.setAttribute("aria-hidden", "true");
    progress.className = "reading-progress__bar";
    progress.dataset.readingProgress = "";
    progressTrack.appendChild(progress);
    page.querySelector(".area-skip-link")?.after(progressTrack);
  }

  let progressFrame = 0;
  const updateProgress = () => {
    window.cancelAnimationFrame(progressFrame);
    progressFrame = window.requestAnimationFrame(() => {
      const articleRect = article.getBoundingClientRect();
      const articleTop = window.scrollY + articleRect.top;
      const scrollRange = Math.max(1, article.offsetHeight - window.innerHeight);
      const value = Math.min(
        1,
        Math.max(0, (window.scrollY - articleTop) / scrollRange)
      );
      progress.style.transform = `scaleX(${value})`;
    });
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  const underlineTargets = [
    page.querySelector(".article-header h1"),
    page.querySelector("#period-guide-heading"),
    page.querySelector("#ranking-heading"),
    page.querySelector("#price-comparison-heading"),
    page.querySelector("#support-heading"),
    page.querySelector("#selection-points-heading"),
    page.querySelector("#faq-heading"),
    page.querySelector("#summary-heading")
  ].filter(Boolean);

  underlineTargets.forEach((target) => {
    target.classList.add("is-design-underline");
  });

  const revealTargets = [
    ...underlineTargets,
    ...page.querySelectorAll(".editorial-marker")
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window && revealTargets.length) {
    page.classList.add("has-design-motion");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-design-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -200px 0px"
      }
    );

    window.requestAnimationFrame(() => {
      revealTargets.forEach((target) => observer.observe(target));
    });
  } else {
    revealTargets.forEach((target) => target.classList.add("is-design-visible"));
  }

  page.querySelectorAll(".table-scroll-hint").forEach((hint) => {
    const viewport = hint.closest(".table-scroll-viewport");
    if (!viewport) return;

    let dismissTimer = 0;
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      if (dismissTimer) {
        window.clearTimeout(dismissTimer);
        dismissTimer = 0;
      }
      viewport.dispatchEvent(new Event("scroll"));
      hint.classList.remove("is-active");
    };

    const scheduleDismissal = () => {
      if (dismissed || dismissTimer || !hint.classList.contains("is-active")) {
        return;
      }
      dismissTimer = window.setTimeout(dismiss, 3000);
    };

    const hintObserver = new MutationObserver(scheduleDismissal);
    hintObserver.observe(hint, {
      attributes: true,
      attributeFilter: ["class"]
    });
    viewport.addEventListener("scroll", dismiss, { passive: true, once: true });
    scheduleDismissal();
  });
})();
