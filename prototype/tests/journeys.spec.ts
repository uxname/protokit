import { expect, test } from "@playwright/test";
import { expectReqs, go, shot } from "./helpers";

/** The product's paths, step by step as a person walks them; each state is reached by acting, never by switching. */

test("a stranger signs in from the home page and signs out", async ({
  page,
}) => {
  await go(page, "/");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expectReqs(page);
  await shot(page, "01-home-stranger");
  await page.getByRole("link", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/#\/sign-in$/);
  await shot(page, "02-sign-in");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("difference-engine");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong email or password.")).toBeVisible();
  // The email stays; only the password is asked again.
  await expect(page.getByLabel("Email")).toHaveValue("ada@example.com");
  await shot(page, "02b-wrong-password");
  await page.getByLabel("Password").fill("analytical-engine");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Ada Lovelace" }),
  ).toBeVisible();
  await expect(page.getByTestId("proto-panel-open")).toContainText(
    "Ada Lovelace",
  );
  await expectReqs(page);
  await shot(page, "03-home-signed-in");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
});

test("a wrong address shows the page for it, with a way home", async ({
  page,
}) => {
  await go(page, "/no-such-page");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await shot(page, "04-not-found");
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
});
