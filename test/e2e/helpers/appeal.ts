import { expect, type Page } from "@playwright/test";
import { citizenFor } from "./citizen.js";
import { submitIdamLogin } from "./login.js";

/**
 * Walking the appeal, as a citizen would.
 *
 * Each helper answers one page and asserts where it lands, so a spec reads as the journey
 * rather than as a list of selectors. Where the answer changes the route, the helper takes
 * it as an argument and the spec's own name says which branch it is walking.
 *
 * The compliance gate is the part that is open: everything from the start page to
 * `/appeal/decision-letter-check` can be answered without signing in, and the hub behind
 * it cannot. `walkTheGate` therefore ends at the IDAM hand-off, which is exactly where the
 * journey ends for an anonymous visitor.
 */

/**
 * The citizen this run signs in as.
 *
 * Resolved from the base URL, not hard-coded: locally it is the user cftlib's IDAM simulator
 * seeds, and against a deployed environment it is a burner user created on demand. See
 * citizen.ts.
 */

export interface GateAnswers {
  /** The nation radio to choose. England and Wales go on; the others off-ramp. */
  livesIn?: "England" | "Wales" | "Scotland" | "Northern Ireland";
  scheme?: "warPension" | "afcs";
  decisionLetterDate?: { day: string; month: string; year: string };
  /** Why the appeal is late, for a decision date outside 12 months. */
  lateExplanation?: string;
  /** The Section 6 answer. Only asked on an AFCS appeal. */
  askedForReconsideration?: "Yes" | "No";
}

const SCHEME_LABEL = {
  warPension: "War Pensions Scheme",
  afcs: "Armed Forces Compensation Scheme (AFCS)"
} as const;

/** Open the start page and get as far as the first gate question. */
export async function startAppeal(page: Page): Promise<void> {
  await page.goto("/");
  await dismissCookieBanner(page);
  await page.getByRole("button", { name: "Start now" }).click();

  await expect(page.getByRole("heading", { name: "Where does the appellant live?" })).toBeVisible();
}

/**
 * Answer the whole compliance gate, stopping at the sign-in it hands off to.
 *
 * The caller decides the branch. A decision date inside 12 months skips the late-appeal
 * page; a War Pensions appeal skips the reconsideration question, which is the rule worth
 * asserting rather than assuming.
 */
export async function walkTheGate(page: Page, answers: GateAnswers = {}): Promise<void> {
  const { livesIn = "England", scheme = "warPension", decisionLetterDate = recentDate() } = answers;

  await startAppeal(page);
  await page.getByLabel(livesIn, { exact: true }).check();
  await submit(page);

  await expect(page.getByRole("heading", { name: "Which scheme was the decision made under?" })).toBeVisible();
  await page.getByLabel(SCHEME_LABEL[scheme], { exact: true }).check();
  await submit(page);

  await expect(page.getByRole("heading", { name: "What is the date on the decision letter?" })).toBeVisible();
  await fillDate(page, "What is the date on the decision letter?", decisionLetterDate);
  await submit(page);

  if (answers.lateExplanation) {
    await fillText(page, "Why is your appeal late?", answers.lateExplanation);
    await submit(page);
  }

  if (scheme === "afcs") {
    await page.getByLabel(answers.askedForReconsideration ?? "Yes", { exact: true }).check();
    await submit(page);
  }

  await expect(page.getByRole("heading", { name: "Do you have a copy of the decision letter?" })).toBeVisible();
  await page.getByLabel("Yes", { exact: true }).check();
  await submit(page);
}

/**
 * Get the cookie banner out of the way.
 *
 * Not incidental tidying: until it is dismissed its two buttons are on every page, so any
 * selector that looks for "a button" finds three.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const reject = page.getByRole("button", { name: "Reject analytics cookies" });
  if (!(await reject.isVisible().catch(() => false))) {
    return;
  }
  await reject.click();

  // Rejecting swaps the banner for a confirmation with its own button. Waited for with a
  // short explicit timeout rather than a bare click: a click on a locator that never
  // appears blocks for the whole 30-second test timeout, which reads as the journey
  // hanging rather than as a banner that had already gone.
  const hide = page.getByRole("button", { name: "Hide this message" });
  await hide.waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
  if (await hide.isVisible().catch(() => false)) {
    await hide.click();
  }
}

/** Sign in, from wherever the first protected page sent an anonymous visitor. */
export async function signInAsCitizen(page: Page): Promise<void> {
  const baseUrl = new URL(page.url()).origin;
  await submitIdamLogin(page, await citizenFor(baseUrl));
}

export async function fillText(page: Page, label: string, value: string): Promise<void> {
  await page.getByLabel(label, { exact: true }).fill(value);
}

export async function fillDate(page: Page, legend: string, date: { day: string; month: string; year: string }): Promise<void> {
  const group = page.getByRole("group", { name: legend });
  await group.getByLabel("Day").fill(date.day);
  await group.getByLabel("Month").fill(date.month);
  await group.getByLabel("Year").fill(date.year);
}

/** Submit the page and wait for the redirect that follows a valid answer. */
export async function submit(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /^Next$|Continue|Accept and send|Add this evidence/ })
    .first()
    .click();

  // Waited for, because every caller's next act is to read or fill the page that follows. Each
  // submit is a POST-then-redirect, so without this a `getByLabel(...).fill()` can run against
  // the *previous* page — the field is not there yet, and the test fails 30 seconds later on a
  // screenshot of a page caught half-rendered. Playwright's auto-waiting does not cover it: it
  // waits for a locator to appear, not for a navigation it was never told about.
  await page.waitForLoadState("domcontentloaded");
}

export async function goToTask(page: Page, name: string): Promise<void> {
  await page.goto("/appeal/task-list");
  await page.getByRole("link", { name }).click();
  await page.waitForLoadState("domcontentloaded");
}

export async function expectTaskComplete(page: Page, name: string): Promise<void> {
  await page.goto("/appeal/task-list");
  const item = page.locator(".govuk-task-list__item", { has: page.getByRole("link", { name }) });
  await expect(item.locator(".govuk-task-list__status")).toHaveText("Completed");
}

/** A decision-letter date a few days ago, so the appeal is always comfortably in time. */
export function recentDate(): { day: string; month: string; year: string } {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return { day: String(date.getDate()), month: String(date.getMonth() + 1), year: String(date.getFullYear()) };
}

/** A decision-letter date inside the 12-to-24-month window, so the appeal is late but not barred. */
export function lateDate(): { day: string; month: string; year: string } {
  const date = new Date();
  date.setMonth(date.getMonth() - 18);
  return { day: String(date.getDate()), month: String(date.getMonth() + 1), year: String(date.getFullYear()) };
}

/** A decision-letter date past the rule 21(4) bar, which the tribunal cannot extend. */
export function veryLateDate(): { day: string; month: string; year: string } {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 3);
  return { day: String(date.getDate()), month: String(date.getMonth() + 1), year: String(date.getFullYear()) };
}
