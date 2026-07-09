const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".header-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", !isOpen ? "メニューを閉じる" : "メニューを開く");
    toggle.classList.toggle("is-open", !isOpen);
    nav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "メニューを開く");
      toggle.classList.remove("is-open");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    }
  });
}

const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
let activeModal = null;

const closeModal = () => {
  if (!activeModal) return;
  activeModal.classList.remove("is-open");
  activeModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeModal = null;
};

modalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.modalOpen);
    if (!modal) return;

    activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const panel = modal.querySelector(".modal-panel");
    if (panel) panel.focus();
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

const lineLinks = document.querySelectorAll(".line-smart-link");
const desktopQuery = window.matchMedia("(min-width: 768px)");

lineLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const pcHref = link.dataset.pcHref;
    const mobileHref = link.dataset.mobileHref || link.href;

    if (desktopQuery.matches && pcHref) {
      event.preventDefault();
      window.open(pcHref, "_blank", "noopener");
      return;
    }

    link.href = mobileHref;
  });
});
