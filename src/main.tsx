import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
}

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);