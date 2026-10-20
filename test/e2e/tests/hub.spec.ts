import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "../helpers/accessibility.js";
import {
  answerRepresentative,
  answerUksf,
  completeAppeal,
  expectTaskComplete,
  expectTaskStatus,
  fillAddress,
  fillDate,
  fillText,
  goToTask,
  recentDate,
  sectionsProgress,
  signInAsCitizen,
  submit,
  taskGroup,
  walkTheGate
} from "../helpers/appeal.js";

/**
 * The hub, end to end against the local CFT stack.
 *
 * Everything here needs a signed-in citizen, which is what separates it from
 * citizen-journey.spec.ts: the gate makes decisions about whether the appeal can be admitted
 * and is open to anybody, and the hub collects the appeal itself and is not.
 *
 * The last spec is the one that matters — an appeal completed here becomes a StWpaf1 case in
 * CCD with a reference the citizen can quote. The rest pin the hub's own rules: which tasks a
 * given appeal reaches, what the progress count means, and that an answer the citizen takes
 * back does not survive anywhere.
 */

test.describe("the appeal hub", () => {
  test("should mark a task Not started until it is answered, and move the count on", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);
    await expect(page).toHaveURL(/\/appeal\/task-list/);

    await expectTaskStatus(page, "Their name and title", "Not started", "about-the-appellant");
    const before = await sectionsProgress(page);
    await expectNoAccessibilityViolations(page, "the task list");

    await goToTask(page, "Their name and title", "about-the-appellant");
    await fillText(page, "First name", "Idris");
    await fillText(page, "Last name", "Vaughan");
    await submit(page);

    await expectTaskComplete(page, "Their name and title", "about-the-appellant");
    expect(await sectionsProgress(page), "answering one task should move the progress count by one").toEqual({
      done: before.done + 1,
      total: before.total
    });
  });

  test("should answer the questions about the appellant in order, rather than returning to the hub between them", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);

    await goToTask(page, "Their name and title", "about-the-appellant");
    await expect(page).toHaveURL(/\/appeal\/appellant-name/);
    await fillText(page, "First name", "Idris");
    await fillText(page, "Last name", "Vaughan");
    await submit(page);

    // Landing back on the hub here is what makes a half-answered section look finished: the
    // name is Completed, and six more questions about the appellant are still outstanding.
    await expect(page, "the name should lead to the date of birth").toHaveURL(/\/appeal\/date-of-birth/);
    await fillDate(page, "What is the appellant's date of birth?", { day: "14", month: "6", year: "1971" });
    await submit(page);

    await expect(page, "the date of birth should lead to the reference numbers").toHaveURL(/\/appeal\/reference-numbers/);
    await fillText(page, "National Insurance number", "AB 12 34 56 C");
    await submit(page);

    await expect(page, "the reference numbers should lead to the address").toHaveURL(/\/appeal\/appellant-address/);
    await fillAddress(page, { line1: "18 Sycamore Avenue", townOrCity: "Swansea", postcode: "SA1 2BB" });
    await submit(page);

    await expect(page, "the address should lead to the contact details").toHaveURL(/\/appeal\/appellant-contact-details/);
    await fillText(page, "Phone number", "01792 900123");
    await submit(page);

    await expect(page, "the contact details should lead to the service status").toHaveURL(/\/appeal\/service-status/);
    await page.getByLabel("Left service", { exact: true }).check();
    await submit(page);

    // Only the last question in the group returns to the hub.
    await expect(page, "the last question in the group should return to the hub").toHaveURL(/\/appeal\/task-list/);
  });

  test("should drop the representative's tasks on a No and add them on a Yes", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);
    const group = taskGroup(page, "representative");

    await goToTask(page, "Whether there is a representative", "representative");
    await page.getByLabel("No", { exact: true }).check();
    await submit(page);

    // Removed, not greyed out. A task list offering questions the citizen must not answer is
    // worse than no task list.
    await expect(group.getByRole("link"), "a No should leave only the question itself").toHaveCount(1);
    await expect(group.getByRole("link", { name: "Their address", exact: true })).toHaveCount(0);
    await expect(group.getByRole("link", { name: "Their contact details", exact: true })).toHaveCount(0);

    await goToTask(page, "Whether there is a representative", "representative");
    await page.getByLabel("Yes", { exact: true }).check();
    await submit(page);
    await expect(page, "a Yes should chain straight into the representative's name").toHaveURL(/\/appeal\/representative-name/);

    await page.goto("/appeal/task-list");
    await expect(group.getByRole("link")).toHaveCount(5);
    for (const name of ["Their name and organisation", "Their address", "Their DX and reference number", "Their contact details"]) {
      await expect(group.getByRole("link", { name, exact: true }), `"${name}" should be offered once there is a representative`).toBeVisible();
    }
  });

  test("should drop the appointee's tasks on a No and add them on a Yes", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);
    const group = taskGroup(page, "appointee");

    await goToTask(page, "Whether there is an appointee", "appointee");
    await page.getByLabel("No", { exact: true }).check();
    await submit(page);
    await expect(group.getByRole("link")).toHaveCount(1);

    await goToTask(page, "Whether there is an appointee", "appointee");
    await page.getByLabel("Yes", { exact: true }).check();
    await submit(page);
    await expect(page).toHaveURL(/\/appeal\/appointee-name/);

    await page.goto("/appeal/task-list");
    await expect(group.getByRole("link")).toHaveCount(4);
    await expect(group.getByRole("link", { name: "Their name and organisation", exact: true })).toBeVisible();
  });

  test("should require the UKSF Disclosure Cell confirmation only of somebody who served with UK Special Forces", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);
    const group = taskGroup(page, "uksf");

    await answerUksf(page, "No");
    await page.goto("/appeal/task-list");
    await expect(group.getByRole("link")).toHaveCount(1);
    await expect(group.getByRole("link", { name: "UKSF Disclosure Cell advice", exact: true })).toHaveCount(0);

    await goToTask(page, "Whether they served with UK Special Forces", "uksf");
    await page.getByLabel("Yes", { exact: true }).check();
    await submit(page);

    await expect(page.getByRole("heading", { name: "Confirm advice from the UKSF Disclosure Cell" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "the UKSF Disclosure Cell confirmation");
    await page.getByLabel(/I confirm that advice has been taken/).check();
    await submit(page);

    await expectTaskComplete(page, "UKSF Disclosure Cell advice", "uksf");
  });

  test("should reach its total with the optional supporting-evidence task untouched", async ({ page }) => {
    // Answers everything except the one optional task, so this needs more than the default 30
    // seconds. Nothing like the round trip below: no evidence row and no submission.
    test.setTimeout(120_000);

    await completeAppeal(page);

    // The contradiction this pins: counting an optional task meant the hub read "23 of 24
    // sections" directly above "You have answered everything the tribunal needs". An optional
    // task the citizen has nothing to put in stays un-ticked forever, so counting it makes the
    // total unreachable.
    await expectTaskStatus(page, "Your supporting evidence", "Optional", "documents");
    const progress = await sectionsProgress(page);
    expect(progress.done, "the count should reach its total with the optional task untouched").toBe(progress.total);
    await expect(page.getByText("You have answered everything the tribunal needs")).toBeVisible();

    await page.goto("/appeal/check-answers");
    await expect(page.getByRole("button", { name: "Continue to the declaration" })).toBeVisible();
    await expect(page.getByText("None added"), "the summary should say so rather than leaving a gap").toBeVisible();
  });

  test("should refuse to submit while a section is outstanding, and say which answers are missing", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);

    await page.goto("/appeal/check-answers");

    // Rendered rather than refused: somebody who cannot work out what is missing from the task
    // list can see it here. What it must not do is offer the declaration.
    await expect(page.getByText("Not answered").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to the declaration" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to the task list" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "check answers, with sections outstanding");
  });

  test("should take a Change link to the question it changes, and show the new answer on the way back", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);

    await goToTask(page, "Their name and title", "about-the-appellant");
    await fillText(page, "First name", "Idris");
    await fillText(page, "Last name", "Vaughan");
    await submit(page);

    await page.goto("/appeal/check-answers");
    await expect(page.getByText("Idris Vaughan")).toBeVisible();

    // The change link has to say what it changes, or a screen reader hears a page of "Change".
    await page.getByRole("link", { name: "Change the appellant's name" }).click();
    await expect(page).toHaveURL(/\/appeal\/appellant-name/);
    await expect(page.getByLabel("First name", { exact: true }), "the page should be filled in with what they said before").toHaveValue("Idris");

    await fillText(page, "First name", "Idrys");
    await submit(page);

    await page.goto("/appeal/check-answers");
    await expect(page.getByText("Idrys Vaughan")).toBeVisible();
    await expect(page.getByText("Idris Vaughan")).toHaveCount(0);
  });

  test("should leave nothing behind when the representative answer changes to No", async ({ page }) => {
    test.setTimeout(60_000);

    await walkTheGate(page);
    await signInAsCitizen(page);

    await answerRepresentative(page, "Yes");
    await expectTaskComplete(page, "Their name and organisation", "representative");
    await page.goto("/appeal/check-answers");
    await expect(page.getByText("Gwen Pritchard")).toBeVisible();

    await answerRepresentative(page, "No");

    // The details are not just hidden. Anything the citizen can no longer see or change must
    // not still be on the appeal when it reaches CCD, or the tribunal writes to a
    // representative nobody meant to name.
    await page.goto("/appeal/task-list");
    await expect(taskGroup(page, "representative").getByRole("link")).toHaveCount(1);

    await page.goto("/appeal/check-answers");
    const whetherThereIs = page.locator(".govuk-summary-list__row", { has: page.getByText("There is a representative", { exact: true }) });
    await expect(whetherThereIs.locator(".govuk-summary-list__value"), "the answer they gave should still be shown back to them").toHaveText("No");
    await expect(page.getByText("Gwen Pritchard")).toHaveCount(0);
    await expect(page.getByText("Royal British Legion")).toHaveCount(0);
    await expect(page.getByText("gwen.pritchard@example.com")).toHaveCount(0);

    // And a later Yes starts from nothing rather than from the cleared answers.
    await goToTask(page, "Whether there is a representative", "representative");
    await page.getByLabel("Yes", { exact: true }).check();
    await submit(page);
    await expectTaskStatus(page, "Their name and organisation", "Not started", "representative");
  });

  test("should list a piece of supporting evidence once it is added, and let it be taken off again", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);

    await goToTask(page, "Your supporting evidence", "documents");
    await expect(page.getByText("You have not added any evidence yet.")).toBeVisible();

    await fillText(page, "What is the evidence?", "Audiology report on hearing loss");
    await fillText(page, "Who signed or wrote it? (optional)", "Dr M. Shah");
    await page.getByRole("button", { name: "Add this evidence" }).click();

    // Exact, because the Remove button's own aria-label names the row it removes.
    await expect(page.getByRole("cell", { name: "Audiology report on hearing loss", exact: true })).toBeVisible();
    await expectNoAccessibilityViolations(page, "supporting evidence, with a row added");

    await page.getByRole("button", { name: "Remove: Audiology report on hearing loss" }).click();
    await expect(page.getByText("You have not added any evidence yet.")).toBeVisible();
  });

  test("should send a completed appeal to CCD and give the citizen its reference", async ({ page }) => {
    // The one spec that answers every question, so it is the one the default 30 seconds does not
    // fit: 40-odd navigations, three axe scans and a real round trip to CCD. Raised here rather
    // than in the config so every other spec keeps a timeout tight enough to be useful.
    test.setTimeout(180_000);

    await completeAppeal(page, { representative: true, supportingEvidence: true, supportNeeds: true });

    await page.goto("/appeal/check-answers");
    await expect(page.getByRole("heading", { name: "Check your answers before sending your appeal" })).toBeVisible();
    await expect(page.getByText("Idris Vaughan")).toBeVisible();
    await expect(page.getByText("Gwen Pritchard")).toBeVisible();
    await expectNoAccessibilityViolations(page, "check answers, complete");

    await page.getByRole("button", { name: "Continue to the declaration" }).click();

    await page.getByLabel("I am the appellant, and I believe that the facts stated in this appeal are true", { exact: true }).check();
    await page.getByLabel("The appellant", { exact: true }).check();
    await fillText(page, "Full name", "Idris Vaughan");
    await fillText(page, "Signature", "Idris Vaughan");
    await fillDate(page, "Date", recentDate());
    // aria-allowed-attr is disabled here and nowhere else. govuk-frontend's radios script puts
    // aria-expanded on the radio input that drives the appointee's conditional reveal, and axe
    // does not allow that attribute on role=radio — it is the Design System component's own
    // behaviour, not this page's markup, and it is invisible to `yarn test:a11y` because jsdom
    // never runs the script. Everything else on the page is still checked.
    await expectNoAccessibilityViolations(page, "the declaration", ["aria-allowed-attr"]);
    await page.getByRole("button", { name: "Accept and send your appeal" }).click();

    await expect(page.getByRole("heading", { name: "Appeal sent" })).toBeVisible();
    // CCD's 16-digit case reference, in the groups of four a citizen has to read out on the
    // phone. A panel without one would tell them their appeal had been sent with nothing to
    // show it had.
    await expect(page.locator(".govuk-panel")).toContainText(/\d{4} \d{4} \d{4} \d{4}/);
    await expect(page.getByText("If you have not received confirmation within 14 days")).toBeVisible();
    await expectNoAccessibilityViolations(page, "the confirmation page");
  });

  test("should not show a confirmation to somebody who has not submitted", async ({ page }) => {
    await walkTheGate(page);
    await signInAsCitizen(page);

    await page.goto("/appeal/confirmation");

    // Telling somebody their appeal has been sent when it has not is the worst thing this page
    // could do, so it sends them back to the start instead.
    await expect(page).toHaveURL("/");
  });
});

test.describe("an appeal with an appointee and UK Special Forces service", () => {
  test("should offer the branches a simpler appeal never reaches, and refuse an appointee's signature with no ground", async ({ page }) => {
    test.setTimeout(180_000);

    await completeAppeal(page, { appointee: true, uksf: true, stillServing: true });

    // The branches the shortest appeal never reaches: the appointee's three tasks, the UKSF
    // confirmation, and the optional discharge date, which is untouched and must not count.
    await expectTaskComplete(page, "Their name and organisation", "appointee");
    await expectTaskComplete(page, "UKSF Disclosure Cell advice", "uksf");
    await expectTaskStatus(page, "Their proposed discharge date", "Optional", "about-the-appellant");
    const progress = await sectionsProgress(page);
    expect(progress.done).toBe(progress.total);

    await page.goto("/appeal/check-answers");
    await expect(page.getByText("Marged Vaughan")).toBeVisible();
    await page.getByRole("button", { name: "Continue to the declaration" }).click();

    // An appointee may sign only where the appellant is under 16 or cannot sign through
    // infirmity, so choosing to sign as one makes the ground a required answer.
    await page.getByLabel("I am the appellant, and I believe that the facts stated in this appeal are true", { exact: true }).check();
    await page.getByLabel("The appointee", { exact: true }).check();
    await fillText(page, "Full name", "Marged Vaughan");
    await fillText(page, "Signature", "Marged Vaughan");
    await fillDate(page, "Date", recentDate());
    await page.getByRole("button", { name: "Accept and send your appeal" }).click();

    await expect(page.locator(".govuk-error-summary")).toContainText("Select why the appointee is signing instead of the appellant");
    // And it keeps the rest of the signature rather than making them type it again.
    await expect(page.getByLabel("Signature", { exact: true })).toHaveValue("Marged Vaughan");

    // The submission itself is proved once, by the round trip above; a second CCD call here
    // would only make one defect fail two specs.
  });
});
