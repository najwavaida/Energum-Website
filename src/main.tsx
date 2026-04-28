import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

console.log("FIREBASE STATUS:", {
  isFirebaseConfigured,
  auth: !!auth,
  db: !!db,
  googleProvider: !!googleProvider,
});

createRoot(document.getElementById("root")!).render(<App />);
