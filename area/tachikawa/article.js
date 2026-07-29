(() => {
  "use strict";

  const page = document.querySelector(".area-ranking-page.area-tachikawa");
  if (!page) return;

  const article = page.querySelector(".ranking-article");
  const toc = page.querySelector("[data-generated-toc]");
  const tocSource = page.querySelector(".toc-source");
  const tocViewport = page.querySelector("[data-toc-viewport]");
  const tocToggle = page.querySelector("[data-toc-toggle]");
  const tocToggleLabel = page.querySelector("[data-toc-toggle-label]");
  const TOC_COLLAPSED_ITEMS = 4;

  if (toc && tocSource) {
    const headings = Array.from(tocSource.querySelectorAll("h2, h3")).filter(
      (heading) =>
        !heading.closest(".article-cta") &&
        !heading.closest(".faq-item") &&
        heading.id !== "toc-title"
    );

    const fragment = document.createDocumentFragment();
    let currentSublist = null;

    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `toc-heading-${index + 1}`;
      }

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      item.appendChild(link);

      if (heading.tagName === "H2") {
        fragment.appendChild(item);
        currentSublist = null;
        return;
      }

      if (!currentSublist) {
        const parentItem = fragment.lastElementChild;
        if (parentItem) {
          currentSublist = document.createElement("ol");
          parentItem.appendChild(currentSublist);
        }
      }

      if (currentSublist) {
        currentSublist.appendChild(item);
      } else {
        fragment.appendChild(item);
      }
    });

    if (headings.length) {
      toc.replaceChildren(fragment);
    }

    if (tocViewport && tocToggle && toc.children.length > TOC_COLLAPSED_ITEMS) {
      const mobileTocQuery = window.matchMedia("(max-width: 760px)");
      let isTocExpanded = false;

      const updateCollapsedHeight = () => {
        const lastVisibleItem = toc.children[TOC_COLLAPSED_ITEMS - 1];
        const nextItem = toc.children[TOC_COLLAPSED_ITEMS];
        if (!lastVisibleItem) return;

        const previewHeight = nextItem
          ? Math.min(34, Math.max(18, nextItem.offsetHeight * 0.35))
          : 24;
        const collapsedHeight =
          lastVisibleItem.offsetTop + lastVisibleItem.offsetHeight + previewHeight;
        tocViewport.style.setProperty(
          "--toc-collapsed-height",
          `${Math.ceil(collapsedHeight)}px`
        );
      };

      const setTocExpanded = (isExpanded) => {
        isTocExpanded = isExpanded;
        tocViewport.classList.toggle("is-collapsed", !isExpanded);
        tocViewport.classList.toggle("is-expanded", isExpanded);
        tocToggle.setAttribute("aria-expanded", String(isExpanded));
        tocToggle.setAttribute(
          "aria-label",
          isExpanded ? "目次を折り畳む" : "目次をすべて開く"
        );
        if (tocToggleLabel) {
          tocToggleLabel.textContent = isExpanded ? "CLOSE" : "OPEN";
        }
      };

      const syncTocMode = () => {
        const isMobile = mobileTocQuery.matches;
        tocViewport.classList.toggle("is-collapsible", isMobile);
        tocToggle.hidden = !isMobile;

        if (isMobile) {
          setTocExpanded(isTocExpanded);
          window.requestAnimationFrame(updateCollapsedHeight);
          return;
        }

        tocViewport.classList.remove("is-collapsed");
        tocViewport.classList.add("is-expanded");
        tocToggle.setAttribute("aria-expanded", "true");
      };

      tocToggle.addEventListener("click", () => {
        const isExpanded = tocToggle.getAttribute("aria-expanded") === "true";
        setTocExpanded(!isExpanded);
      });

      let resizeFrame = 0;
      window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
          syncTocMode();
          if (mobileTocQuery.matches) updateCollapsedHeight();
        });
      });

      if (typeof mobileTocQuery.addEventListener === "function") {
        mobileTocQuery.addEventListener("change", syncTocMode);
      }

      setTocExpanded(false);
      syncTocMode();
    }

    const tocLinksById = new Map(
      headings.map((heading) => [
        heading.id,
        toc.querySelector(`a[href="#${heading.id}"]`)
      ])
    );

    const setCurrentTocLink = (headingId) => {
      tocLinksById.forEach((link, id) => {
        if (!link) return;
        if (id === headingId) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    if ("IntersectionObserver" in window && tocLinksById.size) {
      const tocObserver = new IntersectionObserver(
        (entries) => {
          const currentEntry = entries.find((entry) => entry.isIntersecting);
          if (currentEntry) setCurrentTocLink(currentEntry.target.id);
        },
        {
          rootMargin: "-18% 0px -72% 0px",
          threshold: 0
        }
      );

      headings.forEach((heading) => tocObserver.observe(heading));
    }
  }

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
    const captionId = caption.id || `tachikawa-table-caption-${index + 1}`;
    const instructionsId = `tachikawa-table-instructions-${index + 1}`;
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
    instructions.textContent = wrapper.classList.contains("table-scroll--ranking")
      ? "横にスクロールできます。左端のレンタカー会社名列は固定されています。"
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

      const isMobileViewport = window.innerWidth <= 760;
      scrollHint.classList.toggle(
        "is-active",
        isMobileViewport &&
          isTableScrollable &&
          hasHintEnteredView &&
          !hasTableInteracted
      );
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
        hasTableInteracted = true;
        wrapper.classList.add("has-table-interacted");
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

  const faqList = page.querySelector(".faq-list");
  if (faqList) {
    const questions = Array.from(faqList.querySelectorAll(".faq-item button[aria-controls]"));

    questions.forEach((button) => {
      const answerId = button.getAttribute("aria-controls");
      const answer = answerId ? document.getElementById(answerId) : null;
      if (!answer) return;

      button.setAttribute("aria-expanded", "false");
      answer.hidden = true;

      button.addEventListener("click", () => {
        const isOpen = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!isOpen));
        answer.hidden = isOpen;
      });
    });

    faqList.classList.add("is-enhanced");
  }

  if (article) {
    article.addEventListener("click", (event) => {
      const link = event.target.closest(
        'a[data-cta-page="area-tachikawa"][data-cta-position][data-cta-channel]'
      );
      if (!link || !article.contains(link) || typeof window.gtag !== "function") return;

      window.gtag("event", "area_tachikawa_cta_click", {
        position: link.dataset.ctaPosition,
        channel: link.dataset.ctaChannel,
        destination: link.href
      });
    });
  }
})();
