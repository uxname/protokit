import { expect, test } from "@playwright/test";
import {
  actAs,
  advance,
  docsMode,
  expectReqs,
  go,
  happens,
  lastCode,
  setOnline,
  shot,
  slowServer,
} from "./helpers";

/** The product's paths, step by step as a person walks them; each state is reached by acting, never by switching. */

test("a stranger signs up with the code from the email", async ({ page }) => {
  await go(page, "/");
  await expect(page).toHaveURL(/#\/sign-in$/);
  await shot(page, "01-sign-in");
  await page.getByRole("link", { name: "Sign up" }).click();
  await page.getByLabel("Name").fill("Mike Miller");
  await page.getByLabel("Email").fill("mike@millers.family");
  await page.getByLabel("Password").fill("short");
  await expect(page.getByRole("button", { name: "Get a code" })).toBeDisabled();
  await page.getByLabel("Password").fill("blue-sky-2026");
  await shot(page, "02-sign-up");
  await page.getByRole("button", { name: "Get a code" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  await shot(page, "03-code");
  await expect(
    page.getByRole("button", { name: /Send the code again in/ }),
  ).toBeDisabled();
  await advance(page, "hour");
  await expect(
    page.getByRole("button", { name: "Send the code again" }),
  ).toBeEnabled();
  await shot(page, "03c-resend");
  const code = await lastCode(page);
  expect(code).toMatch(/^\d{6}$/);
  await page
    .getByLabel("Code from the email")
    .fill(code === "482913" ? "482931" : "482913");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByText("That code doesn't match. Check the email."),
  ).toBeVisible();
  await shot(page, "03b-wrong-code");
  await page.getByLabel("Code from the email").fill(code);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("navigation", { name: "Conversations" }).first(),
  ).toBeVisible();
  await expect(page.getByTestId("proto-panel-open")).toContainText(
    "Mike Miller",
  );
  await expectReqs(page);
  // A new person has no history yet: an empty conversation.
  await page
    .getByRole("link", { name: /Anna Miller/ })
    .first()
    .click();
  await expect(
    page.getByText("Your conversation starts here. Write the first message."),
  ).toBeVisible();
  await shot(page, "03d-empty-thread");
});

test("a wrong password keeps the email; the right one opens the conversations", async ({
  page,
}) => {
  await go(page, "/sign-in");
  await page.getByLabel("Email").fill("anna@millers.family");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong email or password.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("anna@millers.family");
  await shot(page, "04-wrong-password");
  await page.getByLabel("Password").fill("sunny-river");
  // A slow answer shows the button busy.
  await slowServer(page, 5_000);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  await shot(page, "04b-signing-in");
  await slowServer(page, null);
  const grace = page.getByRole("link", { name: /Grandma Grace/ }).first();
  await expect(grace).toContainText("2");
  await shot(page, "05-conversations");
  await grace.click();
  await expect(
    page.getByRole("main").getByText("And sour cream, if they have it"),
  ).toBeVisible();
  // Opening the conversation reads it: the badge goes before the picture is taken.
  await expect(
    page.getByRole("link", { name: /Grandma Grace/ }).first(),
  ).not.toContainText("unread");
  await shot(page, "06-thread");
  await go(page, "/");
  await expect(
    page.getByRole("link", { name: /Grandma Grace/ }).first(),
  ).not.toContainText("unread");
  // A slow server keeps the list loading long enough to photograph it.
  await slowServer(page, 10_000);
  await page.reload();
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await shot(page, "05b-conversations-loading");
  await go(page, "/chat/ben");
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await shot(page, "06b-thread-loading");
  await slowServer(page, null);
});

test("a message sent in one tab appears in the other person's tab", async ({
  context,
}) => {
  const anna = await context.newPage();
  const ben = await context.newPage();
  await go(anna, "/");
  await actAs(anna, "Anna Miller");
  await go(ben, "/");
  await actAs(ben, "Ben Miller");
  await go(ben, "/chat/anna");
  await go(anna, "/chat/ben");
  await anna.getByLabel("Message").fill("Can you pick Mike up from school?");
  await anna.getByRole("button", { name: "Send" }).click();
  await expect(
    anna.getByRole("main").getByText("Can you pick Mike up from school?"),
  ).toBeVisible();
  await expect(
    ben.getByRole("main").getByText("Can you pick Mike up from school?"),
  ).toBeVisible();
  await expect(ben.getByTestId("proto-panel-open")).toContainText("Ben Miller");
});

test("offline the message box explains why nothing can be sent", async ({
  page,
}) => {
  await go(page, "/");
  await actAs(page, "Anna Miller");
  await go(page, "/chat/ben");
  await expect(
    page.getByRole("main").getByText("Found it, thanks!"),
  ).toBeVisible();
  await setOnline(page, false);
  // What was loaded stays on screen without network, as in a real app.
  await expect(
    page.getByRole("main").getByText("Found it, thanks!"),
  ).toBeVisible();
  await expect(page.getByLabel("Message")).toBeDisabled();
  await expect(page.getByText(/You're offline/)).toBeVisible();
  await shot(page, "07-offline");
  // Offline, a fresh page cannot load the list: an error with a way to retry.
  await go(page, "/");
  await page.reload();
  const retry = page.getByRole("button", { name: "Retry" }).first();
  await expect(retry).toBeVisible();
  await shot(page, "07b-offline-list");
  await setOnline(page, true);
  await retry.click();
  await expect(
    page.getByRole("link", { name: /Ben Miller/ }).first(),
  ).toBeVisible();
});

test("time passes and an outside message arrives", async ({ page }) => {
  await go(page, "/");
  await actAs(page, "Anna Miller");
  await go(page, "/chat/ben");
  await page.getByLabel("Message").fill("Bought the tickets");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(
    page.getByRole("main").getByText("just now").last(),
  ).toBeVisible();
  await shot(page, "09-just-sent");
  await advance(page, "day");
  await expect(
    page.getByRole("main").getByText("Bought the tickets").locator(".."),
  ).not.toContainText("just now");
  await happens(page, "Grandma Grace writes to Anna");
  await go(page, "/");
  await expect(
    page.getByRole("link", { name: /Grandma Grace/ }).first(),
  ).toContainText("Are you on your way yet?");
});

test("a wrong address leads back to the conversations", async ({ page }) => {
  await go(page, "/");
  await actAs(page, "Anna Miller");
  await go(page, "/chat/nobody");
  await expect(page.getByText("Conversation not found")).toBeVisible();
  await expect(page.getByLabel("Message")).toHaveCount(0);
  await go(page, "/no-such-page");
  await expect(
    page.getByRole("heading", { name: "This page doesn't exist" }),
  ).toBeVisible();
  await shot(page, "08-not-found");
  await page.getByRole("link", { name: "To conversations" }).click();
  await expect(
    page.getByRole("link", { name: /Ben Miller/ }).first(),
  ).toContainText("You: ");
});

test("documentation mode reaches a disabled button", async ({ page }) => {
  await go(page, "/sign-in");
  const button = page.getByRole("button", { name: "Sign in" });
  await expect(button).toBeDisabled();
  const box = await button.boundingBox();
  if (!box) throw new Error("no Sign in button");
  await docsMode(page, true);
  // A disabled button takes no pointer events: the mode finds it by coordinates.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId("docs-card")).toContainText(
    "A person signs in with an email and a password.",
  );
});
