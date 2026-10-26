import { expect, test } from "@playwright/test";
import index from "../src/generated/doc-index.json" with { type: "json" };
import { t } from "../src/kit/i18n";
import { NOT_SHOWN } from "../src/spec/not-shown";
import { people, seed } from "../src/spec/world";
import { actAs, docsMode, expectReqs, go, panel, panelDialog } from "./helpers";

/**
 * The checks every prototype passes, whatever the product: a stranger gets a screen, each
 * seeded person gets theirs, every requirement mark names a real paragraph, every anchor
 * exists in docs.html, and the panel works — documentation mode, «Not on any screen»,
 * theme. The product's own journeys live in journeys.spec.ts.
 */

const pages: Record<
  string,
  { title: string; anchors: Record<string, { text: string }> }
> = index.pages;

test("a stranger opens the prototype", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, "/");
  await expect(page.getByTestId("proto-panel-open")).toContainText(t.stranger);
  await expect(page.locator("main, form, h1").first()).toBeVisible();
  await expectReqs(page);
  expect(errors).toEqual([]);
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

test("every anchor exists in docs.html", async ({ page }) => {
  const ids = Object.entries(pages).flatMap(([id, p]) =>
    Object.keys(p.anchors).map((a) => `${id}--${a}`),
  );
  expect(ids.length).toBeGreaterThan(0);
  // docs.html draws its pages with a script, so the anchors exist only after it runs.
  for (const id of ids) {
    await page.goto(`/docs.html#${id}`);
    await expect(page.locator(`[id="${id}"]`), id).toBeAttached();
  }
});

test("documentation mode shows the paragraph behind an element", async ({
  page,
}) => {
  await go(page, "/");
  await actAs(page, people(seed())[0].name);
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
  const [doc, anchor] = target.to.split("#^");
  const paragraph = pages[doc].anchors[anchor].text.replace(/\*\*/g, "");
  const url = page.url();

  await docsMode(page, true);
  await page.mouse.move(target.x, target.y);
  const card = page.getByTestId("docs-card");
  await expect(card).toContainText(paragraph.slice(0, 40));
  await expect(
    card.getByRole("link", { name: t.openInDocs }).first(),
  ).toHaveAttribute("href", new RegExp(`${doc}--${anchor}$`));
  // A click pins the card and does not act on the product.
  await page.mouse.click(target.x, target.y);
  expect(page.url()).toBe(url);
  await page.mouse.move(1, 1);
  await expect(card).toContainText(paragraph.slice(0, 40));
  await page.keyboard.press("Escape");
  await expect(card).toHaveCount(0);
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
