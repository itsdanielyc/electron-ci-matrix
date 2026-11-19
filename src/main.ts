/// <reference types="vite/client" />
import { selectBackend, type Backend } from "./api";

// A backend call that fails must be seen: the real-shell suite fails on any
// console error, so a rejected call cannot pass unnoticed.
function reportError(error: unknown): void {
  console.error(error);
}

// A built app without its bridge stops here with a visible message. It never
// carries on against the mock.
function connect(): Backend | undefined {
  try {
    return selectBackend(window.electronBridge, import.meta.env.DEV);
  } catch (error) {
    reportError(error);
    const alert = document.createElement("p");
    alert.setAttribute("role", "alert");
    alert.textContent = error instanceof Error ? error.message : String(error);
    document.querySelector("main")?.replaceChildren(alert);
    return undefined;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const backend = connect();
  if (!backend) return;

  const input = document.querySelector<HTMLInputElement>("#greet-input");
  const msg = document.querySelector<HTMLElement>("#greet-msg");
  const badge = document.querySelector<HTMLElement>("#backend-badge");

  if (badge) {
    badge.textContent = backend.kind === "native" ? "native" : "mock";
    badge.dataset.kind = backend.kind;
  }

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input || !msg) return;
    backend
      .greet(input.value)
      .then((text) => {
        msg.textContent = text;
      })
      .catch(reportError);
  });

  document.querySelector("#clear-btn")?.addEventListener("click", () => {
    if (msg) msg.textContent = "";
  });

  backend
    .platformInfo()
    .then((info) => {
      const el = document.querySelector<HTMLElement>("#platform");
      if (el) el.textContent = `${info.os} / ${info.arch}`;
    })
    .catch(reportError);
});
