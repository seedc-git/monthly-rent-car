(() => {
  const carousels = document.querySelectorAll("[data-media-carousel]");
  if (!carousels.length) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPauseQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector("[data-media-viewport]");
    const track = carousel.querySelector("[data-media-track]");
    const toggle = carousel.querySelector("[data-media-toggle]");
    const toggleIcon = toggle?.querySelector(".media-motion-toggle-icon");
    const toggleText = toggle?.querySelector(".media-motion-toggle-text");
    if (!viewport || !track || !toggle) return;

    let animation = null;
    let userPaused = false;
    let pointerInside = false;
    let isIntersecting = true;
    let focusMode = false;
    let resizeTimer = null;

    const updateToggle = () => {
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute(
        "aria-label",
        userPaused ? "MEDIAの自動スクロールを再開する" : "MEDIAの自動スクロールを一時停止する"
      );
      if (toggleIcon) toggleIcon.textContent = userPaused ? "▶" : "Ⅱ";
      if (toggleText) toggleText.textContent = userPaused ? "再生" : "一時停止";
    };

    const syncPlayback = () => {
      if (!animation) return;
      const cardHasFocus = track.contains(document.activeElement);
      const shouldPause =
        userPaused || pointerInside || cardHasFocus || document.hidden || !isIntersecting;
      if (shouldPause) {
        animation.pause();
      } else {
        animation.play();
      }
      carousel.classList.toggle("is-paused", shouldPause);
    };

    const showFocusedCard = (target) => {
      const card = target?.closest?.(".media-card");
      if (!card || !carousel.classList.contains("is-auto-scrolling")) return;

      focusMode = true;
      animation?.cancel();
      animation = null;
      track.style.transform = "translate3d(0, 0, 0)";

      const cardLeft = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const centeredInset = Math.max(0, (viewport.clientWidth - card.offsetWidth) / 2);
      track.style.transform = `translate3d(${centeredInset - cardLeft}px, 0, 0)`;
      carousel.classList.add("is-paused");
    };

    const enterManualPause = () => {
      const viewportLeft = viewport.getBoundingClientRect().left;
      const trackLeft = track.getBoundingClientRect().left;
      const currentOffset = viewportLeft - trackLeft;

      animation?.cancel();
      animation = null;
      focusMode = false;
      track.style.transform = "translate3d(0, 0, 0)";
      carousel.classList.remove("is-auto-scrolling");
      carousel.classList.add("is-paused");

      const maxScroll = Math.max(0, track.scrollWidth - viewport.clientWidth);
      viewport.scrollLeft = Math.min(maxScroll, Math.max(0, currentOffset));
    };

    const buildAnimation = () => {
      animation?.cancel();
      animation = null;
      focusMode = false;
      track.style.transform = "translate3d(0, 0, 0)";
      carousel.classList.remove("is-auto-scrolling", "is-paused");
      updateToggle();

      if (reducedMotionQuery.matches || typeof track.animate !== "function") {
        toggle.hidden = true;
        return;
      }

      toggle.hidden = false;
      if (userPaused) {
        carousel.classList.add("is-paused");
        return;
      }

      viewport.scrollLeft = 0;
      const trackWidth = track.scrollWidth;
      const viewportWidth = viewport.clientWidth;
      if (!trackWidth || !viewportWidth) return;

      const leftEnd = -trackWidth;
      const rightStart = viewportWidth;
      const firstDistance = Math.abs(leftEnd);
      const totalDistance = firstDistance + rightStart;
      const resetOffset = firstDistance / totalDistance;
      const speed = Math.max(24, Number(carousel.dataset.mediaSpeed) || 48);
      const duration = Math.max(14000, (totalDistance / speed) * 1000);

      animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)", offset: 0 },
          { transform: `translate3d(${leftEnd}px, 0, 0)`, offset: resetOffset },
          { transform: `translate3d(${rightStart}px, 0, 0)`, offset: resetOffset },
          { transform: "translate3d(0, 0, 0)", offset: 1 }
        ],
        {
          duration,
          iterations: Infinity,
          easing: "linear"
        }
      );

      carousel.classList.add("is-auto-scrolling");
      const focusedCard = track.contains(document.activeElement)
        ? document.activeElement.closest?.(".media-card")
        : null;
      if (focusedCard) {
        showFocusedCard(focusedCard);
      } else {
        syncPlayback();
      }
    };

    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      updateToggle();
      if (userPaused) {
        enterManualPause();
      } else {
        buildAnimation();
      }
    });

    viewport.addEventListener("mouseenter", () => {
      if (hoverPauseQuery.matches) {
        pointerInside = true;
        syncPlayback();
      }
    });

    viewport.addEventListener("mouseleave", () => {
      pointerInside = false;
      syncPlayback();
    });

    track.addEventListener("focusin", (event) => showFocusedCard(event.target));
    track.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (track.contains(document.activeElement)) {
          showFocusedCard(document.activeElement);
        } else if (focusMode) {
          buildAnimation();
        }
      });
    });
    document.addEventListener("visibilitychange", syncPlayback);

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting;
          syncPlayback();
        },
        { threshold: 0.01 }
      );
      observer.observe(carousel);
    }

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildAnimation, 180);
    });

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", buildAnimation);
    }

    window.requestAnimationFrame(buildAnimation);
  });
})();
