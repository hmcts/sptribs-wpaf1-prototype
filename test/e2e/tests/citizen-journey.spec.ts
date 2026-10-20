import { expect, type Page, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "../helpers/accessibility.js";
import { dismissCookieBanner, lateDate, startAppeal, submit, veryLateDate, walkTheGate } from "../helpers/appeal.js";

/**
 * The compliance gate, end to end against the local CFT stack.
 *
 * The gate is where this service makes decisions rather than collecting answers: it turns
 * Scotland and Northern Ireland away, it routes a War Pensions appellant past Section 6,
 * and it puts a late appeal on one of two different pages depending on which side of the
 * 24-month bar it falls. Each of those is a rule from the 2008 Rules, and each is asserted
 * here rather than inferred from the unit tests, because the rule and the routing are two
 * separate things that can disagree.
 *
 * The hub's own specs — completing every section, check-your-answers, the declaration and
 * the CCD submit — need a signed-in citizen and live in hub.spec.ts.
 */

test.describe("the compliance gate", () => {
  test("should let somebody read what they are getting into before signing in", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Appeal a War Pension or Armed Forces Compensation Scheme decision");
    // The three things that decide whether this service is theirs at all.
    await expect(page.getByText("You must appeal within 12 months")).toBeVisible();
    await expect(page.getByText("After 2 years the tribunal cannot accept an appeal")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where you live" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "the start page");
  });

  test("should ask where the appellant lives before asking anyone to sign in", async ({ page }) => {
    await page.goto("/appeal/where-do-you-live");

    await expect(page.getByRole("heading", { name: "Where does the appellant live?" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "where do you live");
  });

  test("should send an anonymous visitor to sign in at the hub, not before it", async ({ page }) => {
    await page.goto("/appeal/task-list");

    // Asserted on the host, not on IDAM's markup: the simulator and real IDAM serve
    // different forms, and either is a correct outcome here. What matters is that the
    // app handed off rather than showing the task list to somebody anonymous.
    await expect(page).toHaveURL(/idam-web-public|localhost:5062/);
  });

  test("should turn a Scottish appellant away, and say where their appeal goes", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("Scotland", { exact: true }).check();
    await submit(page);

    await expect(page.getByRole("heading", { name: "You cannot use this service to appeal in Scotland" })).toBeVisible();
    await expect(page.getByText("Pensions Appeal Tribunal for Scotland")).toBeVisible();
    await expect(page.getByRole("link", { name: /form WPAF1/ })).toBeVisible();
    await expectNoAccessibilityViolations(page, "the Scotland off-ramp");
  });

  test("should turn a Northern Irish appellant away, and say where their appeal goes", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("Northern Ireland", { exact: true }).check();
    await submit(page);

    await expect(page.getByRole("heading", { name: "You cannot use this service to appeal in Northern Ireland" })).toBeVisible();
    await expect(page.getByText("Pensions Appeal Tribunal for Northern Ireland")).toBeVisible();
  });

  test("should show an error summary that links to the field, not just a red box", async ({ page }) => {
    await page.goto("/appeal/where-do-you-live");
    await dismissCookieBanner(page);
    await submit(page);

    const summary = page.locator(".govuk-error-summary");
    await expect(summary).toContainText("There is a problem");
    await expect(summary.getByRole("link", { name: "Select where the appellant lives" })).toBeVisible();

    // The summary link has to move focus to the input, or it is decoration.
    await summary.getByRole("link").click();
    await expect(page.getByLabel("England", { exact: true })).toBeFocused();
    await expectNoAccessibilityViolations(page, "where do you live, with an error");
  });

  test("should answer 'I am not sure' with guidance rather than an error", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("England", { exact: true }).check();
    await submit(page);

    await page.getByLabel("I am not sure", { exact: true }).check();
    await submit(page);

    // Not knowing which scheme is not a mistake, so the page re-asks with the 6 April 2005
    // rule opened rather than telling the citizen off.
    await expect(page).toHaveURL(/which-scheme/);
    await expect(page.locator(".govuk-error-summary")).toHaveCount(0);
    await expect(page.getByText("Read the guidance below")).toBeVisible();
    await expect(page.getByText("If the service was before 6 April 2005")).toBeVisible();
    await expectNoAccessibilityViolations(page, "which scheme, after 'I am not sure'");
  });

  test("should never ask a War Pensions appellant about an AFCS reconsideration", async ({ page }) => {
    await walkTheGate(page, { scheme: "warPension" });

    // Section 6 is AFCS only, so the gate goes straight from the dates to sign-in.
    await expect(page).toHaveURL(/idam-web-public|localhost:5062/);
  });

  test("should ask an AFCS appellant about a reconsideration, and not block a No", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("England", { exact: true }).check();
    await submit(page);
    await page.getByLabel("Armed Forces Compensation Scheme (AFCS)", { exact: true }).check();
    await submit(page);
    await submitRecentDecisionDate(page);

    await expect(page.getByRole("heading", { name: "Have you asked the Secretary of State to look at the decision again?" })).toBeVisible();
    await expect(page.getByText("the tribunal must send your form to Defence Business Services")).toBeVisible();
    await page.getByLabel("No", { exact: true }).check();
    await submit(page);

    // Answering No does not stop the appeal — the tribunal refers the form on.
    await expect(page.getByRole("heading", { name: "Do you have a copy of the decision letter?" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "the decision letter check");
  });

  test("should ask a late appellant to explain, rather than stopping them", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("England", { exact: true }).check();
    await submit(page);
    await page.getByLabel("War Pensions Scheme", { exact: true }).check();
    await submit(page);
    await submitDecisionDate(page, lateDate());

    // Between 12 and 24 months the appeal goes ahead unless Veterans UK objects, so being
    // late is a question and not a dead end.
    await expect(page).toHaveURL(/appeal-is-late/);
    await expect(page.getByText("Veterans UK has 28 days to object")).toBeVisible();
    await expectNoAccessibilityViolations(page, "the late appeal explanation");
  });

  test("should warn past the 24-month bar, and still take the appeal", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("England", { exact: true }).check();
    await submit(page);
    await page.getByLabel("War Pensions Scheme", { exact: true }).check();
    await submit(page);
    await submitDecisionDate(page, veryLateDate());

    // Rule 21(4): the tribunal cannot extend this limit. It is still the tribunal and not
    // this form that decides whether the appeal is admitted, so the reasons are collected
    // and the journey goes on.
    await expect(page).toHaveURL(/appeal-is-very-late/);
    await expect(page.getByText("The tribunal cannot extend the time limit beyond 2 years")).toBeVisible();
    await expectNoAccessibilityViolations(page, "past the 24-month bar");

    await page.getByLabel("Why is your appeal late?", { exact: true }).fill("I was not told I could appeal.");
    await submit(page);
    await expect(page.getByRole("heading", { name: "Do you have a copy of the decision letter?" })).toBeVisible();
  });

  test("should stop somebody who does not have the decision letter, and say how to get one", async ({ page }) => {
    await startAppeal(page);
    await page.getByLabel("England", { exact: true }).check();
    await submit(page);
    await page.getByLabel("War Pensions Scheme", { exact: true }).check();
    await submit(page);
    await submitRecentDecisionDate(page);

    await page.getByLabel("No", { exact: true }).check();
    await submit(page);

    await expect(page.getByRole("heading", { name: "You need a copy of the decision letter" })).toBeVisible();
    await expect(page.getByText("Contact Veterans UK and ask for another copy")).toBeVisible();
    await expectNoAccessibilityViolations(page, "the no-decision-letter off-ramp");
  });
});

async function submitDecisionDate(page: Page, date: { day: string; month: string; year: string }): Promise<void> {
  const group = page.getByRole("group", { name: "What is the date on the decision letter?" });
  await group.getByLabel("Day").fill(date.day);
  await group.getByLabel("Month").fill(date.month);
  await group.getByLabel("Year").fill(date.year);
  await submit(page);
}

async function submitRecentDecisionDate(page: Page): Promise<void> {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  await submitDecisionDate(page, { day: String(date.getDate()), month: String(date.getMonth() + 1), year: String(date.getFullYear()) });
}
