import { expect, type Page } from "@playwright/test";
import index from "../src/generated/doc-index.json" with { type: "json" };
import { t } from "../src/kit/i18n";

/**
 * Steps a journey takes through the prototype's panel, as a tester would: whose eyes,
 * the inbox, the clock, the network, the events. Plus `go` for hash routes, `shot` for
 * the design review, `expectReqs` for the requirement marks and `docsMode`. The button
 * names come from the panel's own dictionary, so the helpers work in either language.
 */

/** Opens a screen of the product: the prototype routes by hash, so "/chat/1" is "/#/chat/1". */
export const go = (page: Page, path: string) => page.goto(`/#${path}`);

export const panelDialog = (page: Page) =>
  page.getByRole("dialog", { name: t.panel });

export const panel = async (page: Page, tab: keyof typeof t.tabs) => {
  const dialog = panelDialog(page);
  const open = page.getByTestId("proto-panel-open");
  await expect(open.or(dialog)).toBeVisible();
  if (await open.isVisible()) await open.click();
  await dialog
    .getByRole("button", { name: new RegExp(`^${t.tabs[tab]}`) })
    .click();
};

export const closePanel = async (page: Page) => {
  const close = page.getByRole("button", { name: t.fold });
  if (await close.isVisible()) await close.click();
};

/** Takes the eyes of a person by name (as «People» lists them), or of a stranger with null. */
export const actAs = async (page: Page, name: string | null) => {
  await panel(page, "people");
  await panelDialog(page)
    .getByRole("button", { name: name ?? t.stranger })
    .click();
  await closePanel(page);
};

/** The newest code the outside world delivered, read from «Inbox». */
export const lastCode = async (page: Page): Promise<string> => {
  await panel(page, "inbox");
  const code = await panelDialog(page)
    .locator(".font-mono")
    .first()
    .innerText();
  await closePanel(page);
  return code.trim();
};

const STEPS = { hour: 0, day: 1, week: 2, month: 3, halfYear: 4 } as const;

/** Moves the simulated time forward. */
export const advance = async (page: Page, step: keyof typeof STEPS) => {
  await panel(page, "world");
  await page.getByRole("button", { name: t.steps[STEPS[step]] }).click();
  await closePanel(page);
};

export const setOnline = async (page: Page, online: boolean) => {
  await panel(page, "world");
  const box = panelDialog(page).getByRole("checkbox");
  if ((await box.isChecked()) !== online) await box.click();
  await closePanel(page);
};

/** Runs an event of the «World» section by its title. */
export const happens = async (page: Page, title: string) => {
  await panel(page, "world");
  await page
    .getByRole("listitem")
    .filter({ hasText: title })
    .getByRole("button", { name: t.happened })
    .click();
  await closePanel(page);
};

/** Switches the documentation mode from the panel's header. */
export const docsMode = async (page: Page, on: boolean) => {
  await panel(page, "reqs");
  const toggle = panelDialog(page).getByRole("button", { name: t.docsMode });
  if ((await toggle.getAttribute("aria-pressed")) !== String(on))
    await toggle.click();
  await closePanel(page);
};

const pages: Record<string, { anchors: Record<string, unknown> }> = index.pages;

/** Every element marked with <Req> on screen points at a paragraph that exists. */
export const expectReqs = async (page: Page) => {
  const targets = await page
    .locator("[data-req]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-req") ?? ""));
  for (const target of targets) {
    const [doc, anchor = ""] = target.split("#^");
    expect(
      pages[doc]?.anchors[anchor],
      `<Req to="${target}">: no such paragraph`,
    ).toBeTruthy();
  }
};

/**
 * Stretches the simulated server's answer to `ms` (null: back to normal), so a shot can
 * catch a loading state: `await slowServer(page, 10_000)`, act, `shot`, `slowServer(page, null)`.
 */
export const slowServer = (page: Page, ms: number | null) =>
  page.evaluate((v) => {
    if (v === null) localStorage.removeItem("proto-latency");
    else localStorage.setItem("proto-latency", String(v));
  }, ms);

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

/**
 * Four screenshots of the product (panel hidden) for the design review: phone and desktop,
 * light and dark. After a resize the scroll lands anywhere, so the frame returns to the top or
 * to where the person works (the focused element). Transitions are off, or a theme switch
 * is caught halfway. (No full-page shots: they smear fixed headers and bottom bars.)
 */
export const shot = async (page: Page, name: string) => {
  const size = page.viewportSize();
  // The pointer would leave a hover state on whatever it last touched.
  await page.mouse.move(0, 0);
  const atTop = await page.evaluate(() => window.scrollY === 0);
  const hide = await page.addStyleTag({
    content:
      "[data-proto-panel]{display:none!important}*,*::before,*::after{transition:none!important;animation:none!important}",
  });
  for (const scheme of ["light", "dark"] as const) {
    await page.evaluate((s) => {
      document.documentElement.dataset.theme = s;
    }, scheme);
    for (const s of SIZES) {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.evaluate((top) => {
        const el = document.activeElement;
        if (top || !el || el === document.body) window.scrollTo(0, 0);
        else el.scrollIntoView({ block: "center" });
      }, atTop);
      await page.waitForTimeout(150);
      await page.screenshot({
        path: `screens/${name}--${s.name}-${scheme}.png`,
      });
    }
  }
  // Back to the theme the panel chose.
  await page.evaluate(() => {
    const raw = localStorage.getItem("proto-theme");
    const theme = raw ? JSON.parse(raw).state.theme : "system";
    document.documentElement.dataset.theme =
      theme === "dark" ||
      (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
  });
  await hide.evaluate((el) => (el as Element).remove());
  if (size) await page.setViewportSize(size);
};
