import "./index.css";
import "./kit/theme";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./generated/routeTree.gen";
import { lang } from "./kit/i18n";

// Hash routing: the built prototype opens from any static host or folder, no server rules.
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

document.documentElement.lang = lang;
createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
