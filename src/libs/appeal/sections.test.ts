import { describe, expect, it } from "vitest";
import { applicableTasks, completedCount, hasAppointee, hasRepresentative, readyToSubmit, servedWithUksf, stillServing, TASK_GROUPS } from "./sections.js";
import { type AppealDraft, emptyDraft } from "./types.js";

const slugs = (draft: AppealDraft) => applicableTasks(draft).map((task) => task.slug);

describe("TASK_GROUPS", () => {
  it("should point every task at a page that exists", () => {
    // The slug is the URL under /appeal, so a typo here is a task list linking to a 404.
    // The route directories are (slug)/slug.ts, so the slug is also the directory name.
    for (const task of TASK_GROUPS.flatMap((group) => group.tasks)) {
      expect(task.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("should not list the same task twice", () => {
    const all = TASK_GROUPS.flatMap((group) => group.tasks).map((task) => task.slug);

    expect(new Set(all).size).toBe(all.length);
  });

  it("should not put the compliance gate's questions on the hub", () => {
    // Where they live, which scheme, a late appeal and the AFCS reconsideration are asked
    // before the hub, because they decide whether the tribunal can admit the appeal at
    // all. As hub tasks they would be answerable last, or not at all.
    const all = slugs(emptyDraft());

    for (const gate of ["where-do-you-live", "which-scheme", "appeal-is-late", "appeal-is-very-late", "reconsideration", "decision-letter-check"]) {
      expect(all, `${gate} belongs to the gate, not the hub`).not.toContain(gate);
    }
  });
});

describe("applicableTasks", () => {
  it("should ask for a discharge date only from somebody still serving", () => {
    const draft = emptyDraft();
    draft.appellant.serviceStatus = "leftService";
    expect(stillServing(draft)).toBe(false);
    expect(slugs(draft)).not.toContain("discharge-date");

    draft.appellant.serviceStatus = "stillServing";
    expect(stillServing(draft)).toBe(true);
    expect(slugs(draft)).toContain("discharge-date");
  });

  it("should hide the representative's details until there is a representative", () => {
    const draft = emptyDraft();
    draft.representative.hasRepresentative = "No";
    expect(hasRepresentative(draft)).toBe(false);
    expect(slugs(draft)).not.toContain("representative-name");
    expect(slugs(draft)).not.toContain("representative-contact-details");

    draft.representative.hasRepresentative = "Yes";
    expect(slugs(draft)).toContain("representative-name");
    expect(slugs(draft)).toContain("representative-address");
    expect(slugs(draft)).toContain("representative-reference");
    expect(slugs(draft)).toContain("representative-contact-details");
  });

  it("should hide the appointee's details until there is an appointee", () => {
    const draft = emptyDraft();
    draft.appointee.hasAppointee = "No";
    expect(hasAppointee(draft)).toBe(false);
    expect(slugs(draft)).not.toContain("appointee-name");

    draft.appointee.hasAppointee = "Yes";
    expect(slugs(draft)).toContain("appointee-name");
    expect(slugs(draft)).toContain("appointee-address");
    expect(slugs(draft)).toContain("appointee-contact-details");
  });

  it("should ask for the UKSF Disclosure Cell confirmation only from somebody who served with UKSF", () => {
    const draft = emptyDraft();
    draft.uksf.servedWithUksf = "No";
    expect(servedWithUksf(draft)).toBe(false);
    expect(slugs(draft)).not.toContain("uksf-disclosure");

    draft.uksf.servedWithUksf = "Yes";
    expect(slugs(draft)).toContain("uksf-disclosure");
  });

  it("should always ask the questions that do not depend on an answer", () => {
    const always = slugs(emptyDraft());

    expect(always).toContain("who-is-appealing");
    expect(always).toContain("decision-date");
    expect(always).toContain("what-you-are-appealing");
    expect(always).toContain("reasons");
    expect(always).toContain("support");
    expect(always).toContain("documents-checklist");
    expect(always).toContain("uksf");
  });
});

describe("readyToSubmit", () => {
  it("should be false for an empty appeal", () => {
    expect(readyToSubmit(emptyDraft())).toBe(false);
  });

  it("should not be blocked by having added no supporting evidence", () => {
    // Veterans UK serves the claim papers after the appeal is lodged and the appellant
    // then has a month to reply, so requiring evidence up front would turn "you can also
    // add" into a blocker.
    const draft = completeDraft();
    draft.supportingEvidence = [];

    expect(readyToSubmit(draft)).toBe(true);
  });

  it("should not be blocked by a discharge date somebody still serving does not know", () => {
    // "If known" on the paper form. Requiring it would leave anybody still serving who has
    // no discharge date yet unable to send their appeal at all.
    const draft = completeDraft();
    draft.appellant.serviceStatus = "stillServing";
    draft.appellant.proposedDischargeDate = undefined;

    expect(readyToSubmit(draft)).toBe(true);
  });

  it("should be true once every applicable task is answered", () => {
    expect(readyToSubmit(completeDraft())).toBe(true);
  });

  it("should become false again if an answer is cleared", () => {
    const draft = completeDraft();
    draft.reasons.appealReasons = "";

    expect(readyToSubmit(draft)).toBe(false);
  });

  it("should require the National Insurance number", () => {
    // Rule 21(5) wants details of the decision including its full reference, and this is
    // what serves as that reference in practice — so it is required even though the paper
    // form's layout makes it look like one field among several.
    const draft = completeDraft();
    draft.appellant.nationalInsuranceNumber = "";

    expect(readyToSubmit(draft)).toBe(false);
  });

  it("should require the UKSF confirmation once somebody says they served with UKSF", () => {
    const draft = completeDraft();
    draft.uksf = { servedWithUksf: "Yes" };

    expect(readyToSubmit(draft)).toBe(false);

    draft.uksf.disclosureCellConfirmed = "Yes";
    expect(readyToSubmit(draft)).toBe(true);
  });
});

describe("completedCount", () => {
  it("should count only the tasks this appeal reaches", () => {
    const alone = emptyDraft();
    alone.representative.hasRepresentative = "No";

    const represented = emptyDraft();
    represented.representative.hasRepresentative = "Yes";

    expect(completedCount(alone).total).toBeLessThan(completedCount(represented).total);
  });

  it("should reach its total for an appeal with no supporting evidence to list", () => {
    // The bug this pins: supporting evidence never has to be filled in, but it was counted, so
    // a finished appeal read "23 of 24 sections" directly above "You have answered everything
    // the tribunal needs" — the same page telling the citizen both that they were done and that
    // they were not, with nothing they could do about it.
    const draft = completeDraft();
    draft.supportingEvidence = [];

    const { done, total } = completedCount(draft);

    expect(readyToSubmit(draft), "the appeal is submittable, so the count must agree").toBe(true);
    expect(done).toBe(total);
  });

  it("should agree with readyToSubmit in both directions", () => {
    // The property behind it: the count reaching its total and the appeal being sendable are
    // the same statement, so they cannot disagree whatever is or is not filled in.
    const complete = completeDraft();
    complete.supportingEvidence = [];
    const incomplete = completeDraft();
    incomplete.reasons.appealReasons = "";

    for (const draft of [emptyDraft(), complete, incomplete]) {
      const { done, total } = completedCount(draft);
      expect(done === total).toBe(readyToSubmit(draft));
    }
  });

  it("should still count a required task that is unanswered", () => {
    const draft = completeDraft();
    draft.support.needsSupport = undefined;

    const { done, total } = completedCount(draft);
    expect(done).toBeLessThan(total);
  });
});

describe("optional tasks", () => {
  it("should mark the answers the paper form itself calls optional, and only those", () => {
    const optional = TASK_GROUPS.flatMap((group) => group.tasks)
      .filter((task) => task.optional)
      .map((task) => task.slug);

    // The discharge date is "if known"; the DX and reference number are "if you have one";
    // the evidence list can follow after Veterans UK's response.
    expect(optional).toEqual(["discharge-date", "representative-reference", "supporting-evidence"]);
  });

  it("should not let an optional task hold up submission", () => {
    const draft = completeDraft();
    draft.supportingEvidence = [];
    draft.representative = { hasRepresentative: "Yes", firstName: "Ada", lastName: "Nwosu" };

    expect(readyToSubmit(draft)).toBe(false);

    draft.representative.address = { addressLine1: "1 Haig Road", townOrCity: "London", postcode: "SW1A 1AA" };
    draft.representative.emailAddress = "ada@example.com";

    // Everything but the DX and reference number, which is what "optional" has to mean.
    expect(readyToSubmit(draft)).toBe(true);
  });
});

/** An appeal by somebody who has left the service, with every applicable answer given. */
function completeDraft(): AppealDraft {
  const draft = emptyDraft();
  draft.appellant = {
    livesIn: "wales",
    title: "Mr",
    firstName: "Gareth",
    lastName: "Price",
    dateOfBirth: { day: "7", month: "3", year: "1972" },
    nationalInsuranceNumber: "QQ123456C",
    address: { addressLine1: "12 Fern Road", townOrCity: "Cardiff", postcode: "CF10 1AA" },
    emailAddress: "gareth@example.com",
    serviceStatus: "leftService"
  };
  draft.representative = { hasRepresentative: "No" };
  draft.appointee = { hasAppointee: "No" };
  draft.decision = { scheme: "warPension", decisionLetterDate: { day: "1", month: "2", year: "2026" }, appealAbout: ["awardLevel"] };
  draft.reasons = { appealReasons: "The assessment does not reflect how much my knee limits me." };
  draft.support = { needsSupport: "No" };
  draft.uksf = { servedWithUksf: "No" };
  draft.declaration = { capacity: "appellantSigning" };
  draft.documentsChecklist = { decisionLetter: true };
  draft.supportingEvidence = [{ evidenceDescription: "A consultant's report" }];
  return draft;
}
