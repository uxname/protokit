import { expect, test } from "@playwright/test";
import index from "../src/generated/doc-index.json" with { type: "json" };
import { t } from "../src/kit/i18n";
import { DB_VERSION } from "../src/spec/model";
import { NOT_SHOWN } from "../src/spec/not-shown";
import { people, seed } from "../src/spec/world";
import { actAs, docsMode, expectReqs, go, panel, panelDialog } from "./helpers";

/**
 * The checks every prototype passes, whatever the product: a stranger gets a screen, each
 * seeded person gets theirs (a product without sign-in lists nobody, and the panel has no
 * «People»), the skip button, every requirement mark names a real paragraph, every anchor
 * exists in docs.html, the panel works — documentation mode, «Not on any screen»,
 * theme — and a world saved by an older `Db` gives way to a fresh one. The product's own
 * journeys live in journeys.spec.ts.
 */

const pages: Record<
  string,
  { title: string; anchors: Record<string, { text: string; hash: string }> }
> = index.pages;

test("a stranger opens the prototype", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, "/");
  await expect(page.getByTestId("proto-panel-open")).toContainText(t.stranger);
  await expect(page.locator("main, form, h1").first()).toBeVisible();
  await expectReqs(page);
  if (people(seed()).length === 0) {
    await panel(page, "world");
    await expect(
      panelDialog(page).getByRole("button", { name: t.tabs.people }),
    ).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("the skip button moves focus to the content and keeps the address", async ({
  page,
}) => {
  await go(page, "/");
  await expect(page.locator("main").first()).toBeVisible();
  const skip = page.getByRole("button", { name: t.skipToContent });
  // A frame of the product's own without the kit's skip button: nothing to check.
  test.skip((await skip.count()) === 0, "the frame has no skip button");
  const url = page.url();
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  // WCAG 2.2 AA, target size: at least 24 px.
  const box = await skip.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
  expect(page.url()).toBe(url);
});

for (const person of people(seed())) {
  test(`${person.name} signs in from the panel`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await go(page, "/");
    await actAs(page, person.name);
    await expect(page.getByTestId("proto-panel-open")).toContainText(
      person.name,
    );
    await go(page, "/");
    await expect(page.locator("main").first()).toBeVisible();
    await expectReqs(page);
    expect(errors).toEqual([]);
  });
}

test("every block code opens its block in docs.html", async ({ page }) => {
  const links = Object.entries(pages).flatMap(([id, p]) =>
    Object.entries(p.anchors).map(([code, a]) => ({
      code,
      hash: `${id}--${code}@${a.hash}`,
    })),
  );
  expect(links.length).toBeGreaterThan(0);
  // docs.html draws its pages with a script, so the blocks exist only after it runs.
  for (const { code, hash } of links) {
    // a hash-only goto does not reload, and the reader ignores the old hash then
    await page.goto("about:blank");
    await page.goto(`/docs.html#${hash}`);
    await expect(
      // a block code carries data-code (docc_spec); .code is the old docc page
      page
        .locator(`[data-code="${code}"], .code`)
        .filter({ hasText: code })
        .first(),
      hash,
    ).toBeAttached();
  }
});

test("documentation mode shows the paragraph behind an element", async ({
  page,
}) => {
  await go(page, "/");
  const first = people(seed())[0];
  if (first) await actAs(page, first.name);
  await go(page, "/");
  await expect(page.locator("[data-req]").first()).toBeVisible();
  // An element whose middle belongs to it, not to a Req inside it.
  const target = await page.locator("[data-req]").evaluateAll((els) => {
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + Math.min(r.height / 2, 20);
      const hit = document.elementFromPoint(x, y)?.closest("[data-req]");
      if (hit === el && !el.closest("[data-proto-panel]"))
        return { to: el.getAttribute("data-req") ?? "", x, y };
    }
    return null;
  });
  expect(target, "a screen with a <Req> element").not.toBeNull();
  if (!target) return;
  // One Req may name several paragraphs: the first is checked.
  const [doc, code] = target.to.split(",")[0].trim().split("#^");
  const paragraph = pages[doc].anchors[code.toUpperCase()].text.replace(
    /\*\*/g,
    "",
  );
  const url = page.url();

  await docsMode(page, true);
  await page.mouse.move(target.x, target.y);
  // Hovering: a small hint with the code, whole on one line, and the paragraph's start.
  const hint = page.getByTestId("docs-hint");
  await expect(hint).toContainText(code.toUpperCase());
  await expect(hint).toContainText(paragraph.slice(0, 20));
  const chip = hint.getByText(code.toUpperCase(), { exact: true });
  expect((await chip.boundingBox())?.height ?? 99).toBeLessThan(24);
  // A click opens the paragraph in full beside the screen and does not act on the product.
  await page.mouse.click(target.x, target.y);
  expect(page.url()).toBe(url);
  const side = page.getByTestId("docs-card");
  await expect(side).toContainText(paragraph);
  await expect(
    side.getByRole("link", { name: t.openInDocs }).first(),
  ).toHaveAttribute(
    "href",
    new RegExp(`${doc}--${code.toUpperCase()}@[a-z0-9]{4}$`),
  );
  await expect(
    side.getByRole("button", { name: t.copyCode }).first(),
  ).toHaveText(code.toUpperCase());
  // The product moves aside on a wide screen: the side covers none of it.
  const sideBox = await side.boundingBox();
  const bodyRight = await page.evaluate(
    () => document.body.getBoundingClientRect().right,
  );
  if (sideBox && (page.viewportSize()?.width ?? 0) >= 1040)
    expect(bodyRight).toBeLessThanOrEqual(sideBox.x + 1);
  await page.mouse.move(1, 1);
  await expect(side).toContainText(paragraph.slice(0, 40));
  // Esc closes the side first, then leaves the mode.
  await page.keyboard.press("Escape");
  await expect(side).toHaveCount(0);
  await expect(page.locator("[data-req]").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("kbd", { hasText: "Esc" })).toHaveCount(0);
});

test("the panel lists what no screen shows", async ({ page }) => {
  await go(page, "/");
  await panel(page, "reqs");
  const dialog = panelDialog(page);
  await dialog.getByText(t.notShownTitle).click();
  for (const n of NOT_SHOWN) await expect(dialog).toContainText(n.why);
  // Nothing of it is a page of the product: the panel stays where the tester is.
  await expect(page).toHaveURL(/#\/(sign-in)?$/);
});

test("the theme is chosen in the panel", async ({ page }) => {
  await go(page, "/");
  await panel(page, "world");
  await panelDialog(page).getByRole("button", { name: t.themes.dark }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await panelDialog(page).getByRole("button", { name: t.themes.light }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the panel and its tab are dragged out of the way and stay there", async ({
  page,
}) => {
  await go(page, "/");
  const tab = page.getByTestId("proto-panel-open");
  const drag = async (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 5 });
    await page.mouse.up();
  };
  const view = page.viewportSize() ?? { width: 1280, height: 800 };
  const at = await tab.boundingBox();
  if (!at) throw new Error("no panel tab");
  // Dropped past the middle, the tab sticks to the right edge; a drag does not open the panel.
  await drag(
    { x: at.x + at.width / 2, y: at.y + at.height / 2 },
    { x: view.width - 100, y: 120 },
  );
  await expect(panelDialog(page)).toBeHidden();
  const right = await tab.boundingBox();
  expect(Math.round((right?.x ?? 0) + (right?.width ?? 0))).toBe(view.width);
  expect(right?.y ?? 999).toBeLessThan(200);
  // A plain press still opens it; the panel is dragged by its header.
  await tab.click();
  const header = panelDialog(page).locator("header");
  const h = await header.boundingBox();
  if (!h) throw new Error("no panel header");
  await drag({ x: h.x + 40, y: h.y + h.height / 2 }, { x: 400, y: 60 });
  const moved = await panelDialog(page).boundingBox();
  expect(Math.round(moved?.y ?? 0)).toBeLessThan(80);
  // A reload keeps both places.
  await page.reload();
  await expect(tab).toBeVisible();
  const kept = await tab.boundingBox();
  expect(Math.round((kept?.x ?? 0) + (kept?.width ?? 0))).toBe(view.width);
  await tab.click();
  expect(
    Math.round((await panelDialog(page).boundingBox())?.y ?? 0),
  ).toBeLessThan(80);
});

test("a world saved by an older shape of Db is replaced by a fresh one", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, "/");
  // What an older prototype left in the browser: another version, a db without today's fields.
  await page.evaluate((version) => {
    localStorage.setItem(
      "proto-world",
      JSON.stringify({ version, state: { db: {}, online: true, inbox: [] } }),
    );
  }, DB_VERSION - 1);
  await page.reload();
  await expect(page.locator("main, form, h1").first()).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("proto-world") ?? "{}"),
  );
  expect(saved.version).toBe(DB_VERSION);
  expect(Object.keys(saved.state.db)).toEqual(Object.keys(seed()));
  expect(errors).toEqual([]);
});
