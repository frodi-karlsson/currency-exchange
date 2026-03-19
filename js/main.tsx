import { createRoot } from "react-dom/client";
import { CurrencyConverter } from "../src/components/CurrencyConverter.tsx";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  if (root) {
    createRoot(root).render(<CurrencyConverter />);
  }
});
