(() => {
  "use strict";

  const page = document.querySelector(".area-ranking-page.area-tachikawa");
  if (!page) return;

  const article = page.querySelector(".ranking-article");
  const toc = page.querySelector("[data-generated-toc]");
  const tocSource = page.querySelector(".toc-source");

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
