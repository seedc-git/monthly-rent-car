(() => {
  "use strict";

  const page = document.querySelector(".cheap-comparison-guide");
  if (!page) return;

  const tableWrappers = Array.from(page.querySelectorAll(".table-scroll"));
  const tableHintUpdaters = [];
  const TABLE_HINT_PANEL_HEIGHT = 80;
  const TABLE_HINT_TOP_LIMIT = 160;
  const TABLE_HINT_VISIBLE_RATIO = 0.78;
  let tableHintFrame = 0;

  const updateTableHints = () => {
    window.cancelAnimationFrame(tableHintFrame);
    tableHintFrame = window.requestAnimationFrame(() => {
      tableHintUpdaters.forEach((updateHint) => updateHint());
    });
  };

  tableWrappers.forEach((wrapper, index) => {
    if (wrapper.classList.contains("is-table-enhanced")) return;

    const table = Array.from(wrapper.children).find(
      (child) => child.tagName === "TABLE"
    );
    const caption = table ? table.querySelector("caption") : null;
    if (!table || !caption) return;

    const captionText = caption.textContent.replace(/\s+/g, " ").trim();
    const captionId =
      caption.id || `cheap-comparison-table-caption-${index + 1}`;
    const instructionsId =
      `cheap-comparison-table-instructions-${index + 1}`;
    const visibleCaption = document.createElement("div");
    const instructions = document.createElement("span");
    const viewport = document.createElement("div");
    const scrollHint = document.createElement("div");
    const scrollHintPanel = document.createElement("span");
    const scrollHintGesture = document.createElement("span");
    const scrollHintText = document.createElement("span");

    caption.id = captionId;
    caption.classList.add("table-native-caption");

    visibleCaption.className = "table-caption-bar";
    visibleCaption.setAttribute("aria-hidden", "true");
    visibleCaption.textContent = captionText;

    instructions.id = instructionsId;
    instructions.className = "visually-hidden table-scroll-instructions";
    instructions.textContent = wrapper.classList.contains(
      "table-wrap--comparison"
    )
      ? "横にスクロールできます。左端のサービス列は固定されています。"
      : "横にスクロールできます。左端の項目列は固定されています。";

    viewport.className = "table-scroll-viewport";
    scrollHint.className = "table-scroll-hint";
    scrollHint.setAttribute("aria-hidden", "true");
    scrollHintPanel.className = "table-scroll-hint__panel";
    scrollHintGesture.className = "table-scroll-hint__gesture";
    scrollHintText.className = "table-scroll-hint__text";
    scrollHintText.textContent = "横にスクロールできます";
    scrollHintPanel.append(scrollHintGesture, scrollHintText);
    scrollHint.appendChild(scrollHintPanel);
    viewport.append(table, scrollHint);

    wrapper.removeAttribute("role");
    wrapper.removeAttribute("tabindex");
    wrapper.removeAttribute("aria-label");
    wrapper.classList.add("is-table-enhanced", "is-at-start", "is-at-end");
    wrapper.append(visibleCaption, instructions, viewport);

    let isTableScrollable = false;
    let hasHintEnteredView = false;
    let hasTableInteracted = false;
    let hintDismissed = false;
    let hintDismissTimer = 0;

    const dismissHint = () => {
      if (hintDismissed) return;
      hintDismissed = true;
      hasTableInteracted = true;
      wrapper.classList.add("has-table-interacted");
      if (hintDismissTimer) {
        window.clearTimeout(hintDismissTimer);
        hintDismissTimer = 0;
      }
      scrollHint.classList.remove("is-active");
    };

    const updateScrollHint = () => {
      if (!hasHintEnteredView) {
        const viewportRect = viewport.getBoundingClientRect();
        const hintPanelTop = Math.min(
          TABLE_HINT_TOP_LIMIT,
          Math.max(0, (viewportRect.height - TABLE_HINT_PANEL_HEIGHT) / 2)
        );
        const hintCenterY =
          viewportRect.top + hintPanelTop + TABLE_HINT_PANEL_HEIGHT / 2;

        hasHintEnteredView =
          viewportRect.bottom > 0 &&
          hintCenterY > 0 &&
          hintCenterY <= window.innerHeight * TABLE_HINT_VISIBLE_RATIO;
      }

      const shouldShowHint =
        window.innerWidth <= 760 &&
        isTableScrollable &&
        hasHintEnteredView &&
        !hasTableInteracted &&
        !hintDismissed;

      scrollHint.classList.toggle("is-active", shouldShowHint);
      if (shouldShowHint && !hintDismissTimer) {
        hintDismissTimer = window.setTimeout(dismissHint, 3000);
      }
    };

    const updateTableState = () => {
      const maxScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth
      );
      const isScrollable = maxScrollLeft > 2;
      const isAtStart = viewport.scrollLeft <= 2;
      const isAtEnd = viewport.scrollLeft >= maxScrollLeft - 2;

      wrapper.classList.toggle("is-scrollable", isScrollable);
      wrapper.classList.toggle("is-at-start", !isScrollable || isAtStart);
      wrapper.classList.toggle("is-at-end", !isScrollable || isAtEnd);
      wrapper.style.setProperty(
        "--table-caption-height",
        `${visibleCaption.offsetHeight}px`
      );
      isTableScrollable = isScrollable;

      if (isScrollable) {
        viewport.setAttribute("role", "region");
        viewport.setAttribute("tabindex", "0");
        viewport.setAttribute("aria-labelledby", captionId);
        viewport.setAttribute("aria-describedby", instructionsId);
      } else {
        viewport.removeAttribute("role");
        viewport.removeAttribute("tabindex");
        viewport.removeAttribute("aria-labelledby");
        viewport.removeAttribute("aria-describedby");
      }

      updateScrollHint();
    };

    viewport.addEventListener(
      "scroll",
      () => {
        hasTableInteracted = true;
        wrapper.classList.add("has-table-interacted");
        dismissHint();
        updateTableState();
      },
      { passive: true }
    );

    tableHintUpdaters.push(updateScrollHint);

    if ("ResizeObserver" in window) {
      const tableResizeObserver = new ResizeObserver(updateTableState);
      tableResizeObserver.observe(wrapper);
      tableResizeObserver.observe(table);
    } else {
      window.addEventListener("resize", updateTableState);
    }

    window.requestAnimationFrame(updateTableState);
  });

  if (tableHintUpdaters.length) {
    window.addEventListener("scroll", updateTableHints, { passive: true });
    window.addEventListener("resize", updateTableHints);
    updateTableHints();
  }

  const toc = page.querySelector(".article-toc");
  const tocToggle = toc
    ? toc.querySelector(".article-toc__toggle")
    : null;
  if (toc && tocToggle) {
    tocToggle.addEventListener("click", () => {
      const isExpanded = toc.classList.toggle("is-expanded");
      tocToggle.setAttribute("aria-expanded", String(isExpanded));
      tocToggle.textContent = isExpanded
        ? "目次を閉じる"
        : "目次をすべて表示";
    });
  }

  const faq = page.querySelector(".faq-section");
  if (!faq) return;

  const faqItems = Array.from(faq.querySelectorAll(".home-faq-item"));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let faqActionId = 0;

  const clearAnswerTransition = (answer) => {
    if (answer.faqTransitionEnd) {
      answer.removeEventListener(
        "transitionend",
        answer.faqTransitionEnd
      );
      answer.faqTransitionEnd = null;
    }
  };

  const setFaqItemState = (item, isOpen, isClosing = false) => {
    const button = item.querySelector(".home-faq-question");
    const icon = item.querySelector(".home-faq-toggle");
    item.classList.toggle("is-open", isOpen);
    item.classList.toggle("is-closing", isClosing);
    if (button) button.setAttribute("aria-expanded", String(isOpen));
    if (icon) icon.textContent = isOpen ? "−" : "＋";
  };

  const setFaqItemOpen = (item, isOpen, animate = true) => {
    const answer = item.querySelector(".home-faq-answer");
    if (!answer) return Promise.resolve();

    clearAnswerTransition(answer);
    const shouldAnimate = animate && !reduceMotion;

    if (!shouldAnimate) {
      setFaqItemState(item, isOpen);
      answer.hidden = !isOpen;
      answer.style.height = isOpen ? `${answer.scrollHeight}px` : "0px";
      return Promise.resolve();
    }

    if (isOpen) {
      const currentHeight = answer.hidden
        ? 0
        : answer.getBoundingClientRect().height;
      setFaqItemState(item, true);
      answer.hidden = false;
      answer.style.height = `${currentHeight}px`;
      answer.offsetHeight;
      answer.style.height = `${answer.scrollHeight}px`;
      return Promise.resolve();
    }

    if (answer.hidden) {
      setFaqItemState(item, false);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let isResolved = false;
      const finishClose = () => {
        if (isResolved) return;
        isResolved = true;
        clearAnswerTransition(answer);
        if (!item.classList.contains("is-open")) {
          setFaqItemState(item, false);
          answer.hidden = true;
          answer.style.height = "0px";
        }
        resolve();
      };

      setFaqItemState(item, false, true);
      answer.style.height = `${answer.getBoundingClientRect().height}px`;
      answer.offsetHeight;
      answer.style.height = "0px";
      answer.faqTransitionEnd = (event) => {
        if (
          event.target !== answer ||
          event.propertyName !== "height"
        ) return;
        finishClose();
      };
      answer.addEventListener(
        "transitionend",
        answer.faqTransitionEnd
      );
      window.setTimeout(finishClose, 360);
    });
  };

  faqItems.forEach((item) => {
    setFaqItemOpen(item, item.classList.contains("is-open"), false);
  });

  const syncOpenAnswerHeights = () => {
    faqItems.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      const answer = item.querySelector(".home-faq-answer");
      if (!answer || answer.hidden) return;
      answer.style.height = `${answer.scrollHeight}px`;
    });
  };

  window.addEventListener("resize", syncOpenAnswerHeights);

  faqItems.forEach((item) => {
    const button = item.querySelector(".home-faq-question");
    if (!button) return;

    button.addEventListener("click", async () => {
      const actionId = ++faqActionId;
      const shouldOpen =
        button.getAttribute("aria-expanded") !== "true";
      const closeTargets = shouldOpen
        ? faqItems.filter((currentItem) => currentItem !== item)
        : [item];
      await Promise.all(
        closeTargets.map((currentItem) =>
          setFaqItemOpen(currentItem, false)
        )
      );
      if (actionId !== faqActionId) return;
      if (shouldOpen) setFaqItemOpen(item, true);
    });
  });
})();
