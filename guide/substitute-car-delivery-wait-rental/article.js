(() => {
  "use strict";

  const page = document.querySelector(".substitute-car-guide");
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
    const captionId = caption.id || `substitute-table-caption-${index + 1}`;
    const instructionsId = `substitute-table-instructions-${index + 1}`;
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
    instructions.textContent = "横にスクロールできます。左端の項目列は固定されています。";

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
    let dismissTimer = 0;

    const dismissHint = () => {
      hasTableInteracted = true;
      wrapper.classList.add("has-table-interacted");
      scrollHint.classList.remove("is-active");
      if (dismissTimer) {
        window.clearTimeout(dismissTimer);
        dismissTimer = 0;
      }
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

      const shouldShow =
        window.innerWidth <= 760 &&
        isTableScrollable &&
        hasHintEnteredView &&
        !hasTableInteracted;

      scrollHint.classList.toggle("is-active", shouldShow);
      if (shouldShow && !dismissTimer) {
        dismissTimer = window.setTimeout(dismissHint, 3000);
      }
    };

    const updateTableState = () => {
      const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
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
})();
