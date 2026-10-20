import { expect, type Locator, type Page } from "@playwright/test";
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
 * journey ends for an anonymous visitor. `completeAppeal` picks up from there: it signs in and
 * answers every task the appeal reaches, with the four branches as options.
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

/**
 * One group's slice of the task list.
 *
 * Three groups ask the same question about different people — "Their address" and "Their
 * contact details" are each a task in the appellant, representative and appointee groups — so
 * a lookup by task name alone matches three links on the hub. Located by the `aria-describedby`
 * the task-list component builds from the group's id, because that is the only thing in the
 * markup that says which group a list belongs to.
 */
export function taskGroup(page: Page, groupId: string): Locator {
  return page.locator(`ul.govuk-task-list:has(a[aria-describedby^="${groupId}-"])`);
}

/** Open a task from the hub. Pass the manifest's group id where the task name is not unique. */
export async function goToTask(page: Page, name: string, groupId?: string): Promise<void> {
  await page.goto("/appeal/task-list");
  const within = groupId ? taskGroup(page, groupId) : page;
  await within.getByRole("link", { name, exact: true }).click();
  await page.waitForLoadState("domcontentloaded");
}

export type TaskStatus = "Completed" | "Not started" | "Optional";

/** Assert what the hub says about one task, from the hub. */
export async function expectTaskStatus(page: Page, name: string, status: TaskStatus, groupId?: string): Promise<void> {
  await page.goto("/appeal/task-list");
  const within = groupId ? taskGroup(page, groupId) : page;
  const item = within.locator(".govuk-task-list__item", { has: page.getByRole("link", { name, exact: true }) });
  await expect(item.locator(".govuk-task-list__status"), `the status of "${name}" on the task list`).toHaveText(status);
}

export async function expectTaskComplete(page: Page, name: string, groupId?: string): Promise<void> {
  await expectTaskStatus(page, name, "Completed", groupId);
}

/**
 * The hub's progress line, as its two numbers.
 *
 * Read from the page the caller is already on rather than navigating, so a spec can check the
 * count against a task status it has just asserted without reloading between the two.
 */
export async function sectionsProgress(page: Page): Promise<{ done: number; total: number }> {
  const line = await page.getByText(/You have completed \d+ of \d+ sections\./).innerText();
  const counts = line.match(/completed (\d+) of (\d+) sections/);
  if (!counts) {
    throw new Error(`The task list's progress line did not read as counts: "${line}"`);
  }
  return { done: Number(counts[1]), total: Number(counts[2]) };
}

export interface AddressAnswer {
  line1: string;
  townOrCity: string;
  postcode: string;
}

/** Fill the three required parts of an address, leaving line 2 and the county blank. */
export async function fillAddress(page: Page, address: AddressAnswer): Promise<void> {
  await fillText(page, "Address line 1", address.line1);
  await fillText(page, "Town or city", address.townOrCity);
  await fillText(page, "Postcode", address.postcode);
}

/**
 * Answer the representative question, and the four tasks a Yes opens.
 *
 * The DX and reference page is submitted blank: it is the group's one optional task, and a
 * family member or charity adviser acting as representative has neither number.
 */
export async function answerRepresentative(page: Page, hasRepresentative: "Yes" | "No"): Promise<void> {
  await goToTask(page, "Whether there is a representative", "representative");
  await page.getByLabel(hasRepresentative, { exact: true }).check();
  await submit(page);

  if (hasRepresentative === "No") {
    return;
  }

  await expect(page.getByRole("heading", { name: "What is the representative's name?" })).toBeVisible();
  await fillText(page, "First name", "Gwen");
  await fillText(page, "Last name", "Pritchard");
  await fillText(page, "Company or organisation (optional)", "Royal British Legion");
  await submit(page);

  await fillAddress(page, { line1: "4 Mill Lane", townOrCity: "Cardiff", postcode: "CF10 1AA" });
  await submit(page);

  await submit(page);

  await fillText(page, "Email address", "gwen.pritchard@example.com");
  await submit(page);
}

/** Answer the appointee question, and the three tasks a Yes opens. */
export async function answerAppointee(page: Page, hasAppointee: "Yes" | "No"): Promise<void> {
  await goToTask(page, "Whether there is an appointee", "appointee");
  await page.getByLabel(hasAppointee, { exact: true }).check();
  await submit(page);

  if (hasAppointee === "No") {
    return;
  }

  await expect(page.getByRole("heading", { name: "What is the appointee's name?" })).toBeVisible();
  await fillText(page, "First name", "Marged");
  await fillText(page, "Last name", "Vaughan");
  await submit(page);

  await fillAddress(page, { line1: "18 Sycamore Avenue", townOrCity: "Swansea", postcode: "SA1 2BB" });
  await submit(page);

  await fillText(page, "Phone number", "01792 900456");
  await submit(page);
}

/** Answer the UK Special Forces question, and the Disclosure Cell confirmation a Yes requires. */
export async function answerUksf(page: Page, servedWithUksf: "Yes" | "No"): Promise<void> {
  await goToTask(page, "Whether they served with UK Special Forces", "uksf");
  await page.getByLabel(servedWithUksf, { exact: true }).check();
  await submit(page);

  if (servedWithUksf === "No") {
    return;
  }

  await expect(page.getByRole("heading", { name: "Confirm advice from the UKSF Disclosure Cell" })).toBeVisible();
  await page.getByLabel(/I confirm that advice has been taken/).check();
  await submit(page);
}

/** The branches an appeal can take behind the hub. Each default is the commonest answer. */
export interface AppealAnswers {
  /** The gate this appeal came through, which decides the scheme and whether it is late. */
  gate?: GateAnswers;
  /** Names a representative, which opens four more tasks in that group. */
  representative?: boolean;
  /** Names an appointee, which opens three more. */
  appointee?: boolean;
  /** Still serving, which opens the optional proposed-discharge-date task. */
  stillServing?: boolean;
  /** Served with UK Special Forces, which makes the Disclosure Cell confirmation required. */
  uksf?: boolean;
  /** Needs additional support, which leads on to the support-details page. */
  supportNeeds?: boolean;
  /**
   * Add a row to the supporting-evidence table.
   *
   * Left alone by default, and deliberately: it is the journey's one optional task and the hub
   * has to be able to reach its total without it.
   */
  supportingEvidence?: boolean;
}

/**
 * Walk the gate, sign in, and answer every task this appeal reaches, ending on the hub.
 *
 * Each group is entered from the task list and then walked through, which is both how a
 * citizen uses the hub and what proves the group chains: a page that returned to the hub
 * mid-group would leave the next `fillText` looking for a field the task list does not have.
 */
export async function completeAppeal(page: Page, answers: AppealAnswers = {}): Promise<void> {
  const { representative = false, appointee = false, stillServing = false, uksf = false, supportNeeds = false, supportingEvidence = false } = answers;

  await walkTheGate(page, answers.gate);
  await signInAsCitizen(page);
  await expect(page).toHaveURL(/\/appeal\/task-list/);

  await goToTask(page, "Whether you are the appellant", "who-is-appealing");
  await page.getByLabel("I am the appellant", { exact: true }).check();
  await submit(page);

  await goToTask(page, "Their name and title", "about-the-appellant");
  await fillText(page, "Title (optional)", "Mr");
  await fillText(page, "First name", "Idris");
  await fillText(page, "Last name", "Vaughan");
  await submit(page);
  await fillDate(page, "What is the appellant's date of birth?", { day: "14", month: "6", year: "1971" });
  await submit(page);
  await fillText(page, "National Insurance number", "AB 12 34 56 C");
  await submit(page);
  await fillAddress(page, { line1: "18 Sycamore Avenue", townOrCity: "Swansea", postcode: "SA1 2BB" });
  await submit(page);
  await fillText(page, "Phone number", "01792 900123");
  await fillText(page, "Email address", "idris.vaughan@example.com");
  await submit(page);
  await page.getByLabel(stillServing ? "Still serving" : "Left service", { exact: true }).check();
  await submit(page);
  if (stillServing) {
    // Submitted blank. The proposed discharge date is "if known" on the paper form, and
    // somebody still serving often has not been given one.
    await expect(page.getByRole("heading", { name: "When is the appellant due to be discharged?" })).toBeVisible();
    await submit(page);
  }

  await answerRepresentative(page, representative ? "Yes" : "No");
  await answerAppointee(page, appointee ? "Yes" : "No");

  // The date on the decision letter is already answered: the gate asks it, because the time
  // limits run from it.
  await goToTask(page, "What you are appealing about", "the-decision");
  await page.getByLabel("The refusal of an award, or the level of entitlement", { exact: true }).check();
  await submit(page);

  await goToTask(page, "Why you disagree with the decision", "your-reasons");
  await fillText(
    page,
    "Why do you disagree with the decision?",
    "The decision does not take account of the audiology report, and the assessment of hearing loss is lower than the report records."
  );
  await submit(page);

  await goToTask(page, "Whether anyone needs additional support", "support");
  await page.getByLabel(supportNeeds ? "Yes" : "No", { exact: true }).check();
  await submit(page);
  if (supportNeeds) {
    await fillText(page, "What support is needed?", "A hearing loop at the hearing, and letters in large print.");
    await submit(page);
  }

  await answerUksf(page, uksf ? "Yes" : "No");

  // The documents checklist is already answered too: confirming a copy of the decision letter
  // is the last thing the gate asks, and it ticks the same box.
  if (supportingEvidence) {
    await goToTask(page, "Your supporting evidence", "documents");
    await fillText(page, "What is the evidence?", "Audiology report on hearing loss");
    await fillText(page, "Who signed or wrote it? (optional)", "Dr M. Shah");
    await page.getByRole("button", { name: "Add this evidence" }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
  }

  await page.goto("/appeal/task-list");
  // Asserted here rather than left to each spec, so a question this helper stops answering
  // fails as "the appeal is not complete" instead of as a confusing failure further on.
  await expect(page.getByText("You have answered everything the tribunal needs")).toBeVisible();
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
