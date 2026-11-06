import { backend } from "./api";

window.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector<HTMLInputElement>("#greet-input");
  const msg = document.querySelector<HTMLElement>("#greet-msg");
  const badge = document.querySelector<HTMLElement>("#backend-badge");

  if (badge) {
    badge.textContent = backend.kind === "native" ? "native" : "mock";
    badge.dataset.kind = backend.kind;
  }

  document.querySelector("#greet-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (input && msg) msg.textContent = await backend.greet(input.value);
  });

  document.querySelector("#clear-btn")?.addEventListener("click", () => {
    if (msg) msg.textContent = "";
  });

  backend.platformInfo().then((info) => {
    const el = document.querySelector<HTMLElement>("#platform");
    if (el) el.textContent = `${info.os} / ${info.arch}`;
  });
});
