import { describe, expect, it } from "vitest";
import { caseDataFrom, ccdFieldId, isoDate } from "./case-data.js";
import { emptyDraft } from "./types.js";

/**
 * The field ids in `StWpaf1CaseData` (`sptribs-case-api`), as the CCD definition emits
 * them. Pinned here because this is the one place the two repos have to agree, and the
 * failure mode when they do not is not subtle: CCD validates every key against the case
 * type and rejects the whole submission on the first one it does not recognise, so a
 * single wrong id loses the entire appeal.
 *
 * If a question moves, this list is the thing to reconcile — regenerate it with
 * `./gradlew generateCCDConfig` in sptribs-case-api and read
 * `build/definitions/StWpaf1/CaseField.json`.
 */
const CASE_TYPE_FIELDS = new Set([
  "appLivesIn",
  "appTitle",
  "appFirstName",
  "appLastName",
  "appDateOfBirth",
  "appNationalInsuranceNumber",
  "appAfcsMemberNumber",
  "appAddress",
  "appPhoneNumber",
  "appMobileNumber",
  "appEmailAddress",
  "appServiceStatus",
  "appProposedDischargeDate",
  "repHasRepresentative",
  "repFirstName",
  "repLastName",
  "repOrganisation",
  "repAddress",
  "repDxNumber",
  "repReferenceNumber",
  "repPhoneNumber",
  "repMobileNumber",
  "repEmailAddress",
  "aptHasAppointee",
  "aptFirstName",
  "aptLastName",
  "aptOrganisation",
  "aptAddress",
  "aptPhoneNumber",
  "aptMobileNumber",
  "aptEmailAddress",
  "aptSigningGround",
  "dsnScheme",
  "dsnDecisionLetterDate",
  "dsnAppealAbout",
  "dsnAppealAboutOther",
  "rsnAppealReasons",
  "recAskedForReconsideration",
  "timeLateAppealExplanation",
  "supNeedsSupport",
  "supSupportDetails",
  "uksfServedWithUksf",
  "uksfDisclosureCellConfirmed",
  "declCapacity",
  "declSignatoryRole",
  "declFullName",
  "declSignature",
  "declDateSigned",
  "SupportingEvidence"
]);

/** Every answer filled in, so the mapping is exercised against the whole case type. */
function fullDraft() {
  const draft = emptyDraft();
  draft.appellant = {
    livesIn: "england",
    title: "Mr",
    firstName: "Gareth",
    lastName: "Price",
    dateOfBirth: { day: "7", month: "3", year: "1972" },
    nationalInsuranceNumber: "QQ123456C",
    afcsMemberNumber: "AF/1234567",
    address: { addressLine1: "12 Fern Road", addressLine2: "", townOrCity: "Leeds", county: "West Yorkshire", postcode: "LS1 4AB" },
    phoneNumber: "0113 496 0000",
    mobileNumber: "07700 900123",
    emailAddress: "gareth@example.com",
    serviceStatus: "stillServing",
    proposedDischargeDate: { day: "30", month: "9", year: "2026" }
  };
  draft.representative = {
    hasRepresentative: "Yes",
    firstName: "Ada",
    lastName: "Nwosu",
    organisation: "Royal British Legion",
    address: { addressLine1: "1 Haig Road", townOrCity: "London", postcode: "SW1A 1AA" },
    dxNumber: "DX 123456 LONDON",
    referenceNumber: "RBL/2026/0412",
    phoneNumber: "020 7000 0000",
    mobileNumber: "",
    emailAddress: "ada@example.com"
  };
  draft.appointee = { hasAppointee: "No" };
  draft.decision = {
    scheme: "afcs",
    decisionLetterDate: { day: "1", month: "2", year: "2026" },
    appealAbout: ["awardLevel", "other"],
    appealAboutOther: "The decision does not mention my hearing loss."
  };
  draft.reasons = { appealReasons: "The assessment does not reflect how much my knee limits me." };
  draft.reconsideration = { askedForReconsideration: "Yes" };
  draft.timeliness = { lateAppealExplanation: "" };
  draft.support = { needsSupport: "Yes", supportDetails: "A hearing loop, and a seat near the front." };
  draft.uksf = { servedWithUksf: "No" };
  draft.declaration = {
    capacity: "self",
    signatoryRole: "appellant",
    fullName: "Gareth Price",
    signature: "Gareth Price",
    dateSigned: { day: "3", month: "3", year: "2026" }
  };
  draft.supportingEvidence = [
    { evidenceDescription: "Consultant's report", signedBy: "R Patel", documentDate: { day: "21", month: "1", year: "2026" }, pageCount: "4" }
  ];
  return draft;
}

describe("ccdFieldId", () => {
  it("should be the section prefix plus the capitalised property", () => {
    expect(ccdFieldId("appellant", "firstName")).toBe("appFirstName");
    expect(ccdFieldId("appellant", "nationalInsuranceNumber")).toBe("appNationalInsuranceNumber");
  });

  it("should keep the decision and the declaration apart", () => {
    // `dsn` rather than `dec` exists for this reason: `decDateSigned` and
    // `declDateSigned` differ by one character and would be read as the same field.
    expect(ccdFieldId("decision", "decisionLetterDate")).toBe("dsnDecisionLetterDate");
    expect(ccdFieldId("declaration", "dateSigned")).toBe("declDateSigned");
  });

  it("should not exceed CCD's 70-character field-id limit", () => {
    for (const field of CASE_TYPE_FIELDS) {
      expect(field.length, `${field} is longer than CCD allows`).toBeLessThanOrEqual(70);
    }
  });
});

describe("caseDataFrom", () => {
  it("should only produce keys the case type declares", () => {
    for (const key of Object.keys(caseDataFrom(fullDraft()))) {
      expect(CASE_TYPE_FIELDS, `${key} is not a field on StWpaf1, so CCD would reject the whole appeal`).toContain(key);
    }
  });

  it("should map a fully answered appeal onto most of the case type", () => {
    const data = caseDataFrom(fullDraft());

    // Not all 49: a fully answered appeal still skips the questions its own answers rule
    // out, which is the point of the branching.
    expect(Object.keys(data).length).toBeGreaterThan(35);
    expect(data.appFirstName).toBe("Gareth");
    expect(data.dsnScheme).toBe("afcs");
    expect(data.dsnAppealAbout).toEqual(["awardLevel", "other"]);
  });

  it("should send dates as ISO, not as the three parts", () => {
    const data = caseDataFrom(fullDraft());

    expect(data.appDateOfBirth).toBe("1972-03-07");
    expect(data.dsnDecisionLetterDate).toBe("2026-02-01");
    expect(data.appProposedDischargeDate).toBe("2026-09-30");
    expect(data.declDateSigned).toBe("2026-03-03");
  });

  it("should send an address using CCD's own sub-field names", () => {
    expect(caseDataFrom(fullDraft()).appAddress).toEqual({
      AddressLine1: "12 Fern Road",
      PostTown: "Leeds",
      County: "West Yorkshire",
      PostCode: "LS1 4AB"
    });
  });

  it("should omit an unanswered question rather than send null", () => {
    const data = caseDataFrom(emptyDraft());

    expect(data).toEqual({});
  });

  it("should omit the late explanation nobody had to give", () => {
    // An appeal in time leaves Section 7 blank, and a blank long-text field is not an
    // empty string to CCD — it is an absent one.
    expect(caseDataFrom(fullDraft())).not.toHaveProperty("timeLateAppealExplanation");
  });

  it("should omit a half-typed date, because half a date is not a date", () => {
    const draft = emptyDraft();
    draft.appellant.dateOfBirth = { day: "7", month: "", year: "1972" };

    expect(caseDataFrom(draft)).not.toHaveProperty("appDateOfBirth");
  });

  it("should send supporting evidence as a CCD collection", () => {
    expect(caseDataFrom(fullDraft()).SupportingEvidence).toEqual([
      {
        id: null,
        value: { EvidenceDescription: "Consultant's report", SignedBy: "R Patel", DocumentDate: "2026-01-21", PageCount: "4" }
      }
    ]);
  });

  it("should drop an evidence row the citizen left blank", () => {
    const draft = emptyDraft();
    draft.supportingEvidence = [{ evidenceDescription: "", signedBy: "", pageCount: "" }];

    expect(caseDataFrom(draft)).not.toHaveProperty("SupportingEvidence");
  });
});

describe("isoDate", () => {
  it("should pad a single-digit day and month", () => {
    expect(isoDate({ day: "7", month: "3", year: "1972" })).toBe("1972-03-07");
  });

  it("should return nothing for an incomplete date", () => {
    expect(isoDate({ day: "7", month: "3" })).toBeUndefined();
  });
});
