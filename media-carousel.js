(() => {
  const carousels = document.querySelectorAll("[data-media-carousel]");
  if (!carousels.length) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPauseQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  carousels.forEach((carousel, carouselIndex) => {
    const viewport = carousel.querySelector("[data-media-viewport]");
    const track = carousel.querySelector("[data-media-track]");
    const controls = carousel.querySelector("[data-media-controls]");
    const previousButton = carousel.querySelector("[data-media-prev]");
    const nextButton = carousel.querySelector("[data-media-next]");
    const status = carousel.querySelector("[data-media-status]");
    const cards = Array.from(carousel.querySelectorAll(".media-card"));

    if (!viewport || !track || !controls || !previousButton || !nextButton || !cards.length) {
      return;
    }

    const autoplayEnabled = carousel.dataset.mediaAutoplay === "true";
    const interval = Math.max(3000, Number(carousel.dataset.mediaInterval) || 4800);
    const duration = 480;
    const viewportId = viewport.id || `media-carousel-viewport-${carouselIndex + 1}`;

    let activeIndex = 0;
    let timer = null;
    let activeAnimation = null;
    let animationToken = 0;
    let isAnimating = false;
    let isIntersecting = true;
    let pointerInside = false;
    let focusInside = false;
    let resizeTimer = null;

    viewport.id = viewportId;
    previousButton.setAttribute("aria-controls", viewportId);
    nextButton.setAttribute("aria-controls", viewportId);
    if (status) {
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
    }

    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = null;
    };

    const setActiveState = () => {
      cards.forEach((card, index) => {
        const isActive = index === activeIndex;
        card.setAttribute("aria-hidden", String(!isActive));
        card.inert = !isActive;
      });

      if (status) {
        status.textContent = `${activeIndex + 1} / ${cards.length}`;
      }
    };

    const getTrackPosition = (index) => {
      const card = cards[index];
      const viewportStyle = window.getComputedStyle(viewport);
      const horizontalPadding =
        Number.parseFloat(viewportStyle.paddingLeft) +
        Number.parseFloat(viewportStyle.paddingRight);
      const contentWidth = viewport.clientWidth - horizontalPadding;
      const centeredInset = Math.max(0, (contentWidth - card.offsetWidth) / 2);
      return centeredInset - card.offsetLeft;
    };

    const setTrackPosition = (index) => {
      track.style.transform = `translate3d(${getTrackPosition(index)}px, 0, 0)`;
    };

    const scheduleNext = () => {
      clearTimer();
      if (
        !autoplayEnabled ||
        reducedMotionQuery.matches ||
        document.hidden ||
        !isIntersecting ||
        pointerInside ||
        focusInside ||
        isAnimating
      ) {
        return;
      }

      timer = window.setTimeout(() => move(1), interval);
    };

    const settleCurrentCard = () => {
      animationToken += 1;
      activeAnimation?.cancel();
      activeAnimation = null;
      isAnimating = false;
      carousel.classList.remove("is-animating");
      setTrackPosition(activeIndex);
      scheduleNext();
    };

    const move = async (direction) => {
      if (isAnimating) return;

      clearTimer();
      const currentIndex = activeIndex;
      const nextIndex = (activeIndex + direction + cards.length) % cards.length;
      const currentPosition = getTrackPosition(currentIndex);
      const nextPosition = getTrackPosition(nextIndex);

      if (reducedMotionQuery.matches || typeof track.animate !== "function") {
        activeIndex = nextIndex;
        setActiveState();
        setTrackPosition(activeIndex);
        scheduleNext();
        return;
      }

      const wrapsForward = direction > 0 && nextIndex <= currentIndex;
      const wrapsBackward = direction < 0 && nextIndex >= currentIndex;
      const usesLoopTransition = cards.length === 1 || wrapsForward || wrapsBackward;
      const viewportStyle = window.getComputedStyle(viewport);
      const horizontalPadding =
        Number.parseFloat(viewportStyle.paddingLeft) +
        Number.parseFloat(viewportStyle.paddingRight);
      const trackStyle = window.getComputedStyle(track);
      const trackGap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
      const slideDistance =
        Math.max(
          viewport.clientWidth - horizontalPadding,
          cards[currentIndex].offsetWidth,
          cards[nextIndex].offsetWidth
        ) + trackGap;
      const token = ++animationToken;

      const keyframes = usesLoopTransition
        ? [
            { transform: `translate3d(${currentPosition}px, 0, 0)`, offset: 0 },
            {
              transform: `translate3d(${
                currentPosition + (direction > 0 ? -slideDistance : slideDistance)
              }px, 0, 0)`,
              offset: 0.5
            },
            {
              transform: `translate3d(${
                nextPosition + (direction > 0 ? slideDistance : -slideDistance)
              }px, 0, 0)`,
              offset: 0.5
            },
            { transform: `translate3d(${nextPosition}px, 0, 0)`, offset: 1 }
          ]
        : [
            { transform: `translate3d(${currentPosition}px, 0, 0)` },
            { transform: `translate3d(${nextPosition}px, 0, 0)` }
          ];

      isAnimating = true;
      carousel.classList.add("is-animating");
      activeAnimation = track.animate(keyframes, {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      });

      const finishedAnimation = activeAnimation;
      try {
        await finishedAnimation.finished;
      } catch {
        return;
      }

      if (token !== animationToken) return;

      activeIndex = nextIndex;
      setActiveState();
      track.style.transform = `translate3d(${nextPosition}px, 0, 0)`;
      finishedAnimation.cancel();
      if (activeAnimation === finishedAnimation) {
        activeAnimation = null;
      }
      isAnimating = false;
      carousel.classList.remove("is-animating");
      scheduleNext();
    };

    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));

    carousel.addEventListener("mouseenter", () => {
      if (hoverPauseQuery.matches) {
        pointerInside = true;
        clearTimer();
      }
    });

    carousel.addEventListener("mouseleave", () => {
      pointerInside = false;
      scheduleNext();
    });

    carousel.addEventListener("focusin", () => {
      focusInside = true;
      clearTimer();
      if (isAnimating) {
        settleCurrentCard();
      }
    });

    carousel.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        focusInside = carousel.contains(document.activeElement);
        scheduleNext();
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimer();
      } else {
        scheduleNext();
      }
    });

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting;
          scheduleNext();
        },
        { threshold: 0.01 }
      );
      observer.observe(carousel);
    }

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(settleCurrentCard, 180);
    });

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", settleCurrentCard);
    }

    controls.hidden = false;
    carousel.classList.add("is-slider-ready");
    setActiveState();
    setTrackPosition(activeIndex);
    scheduleNext();
  });
})();
