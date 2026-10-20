/**
 * The appeal a citizen is building, one property per WPAF1 section.
 *
 * Everything is optional. A part-finished appeal is the normal state — the task list
 * exists precisely so somebody can answer the sections in any order and come back —
 * so the draft type cannot require anything. Completeness is decided by
 * `#appeal`'s section manifest, not by the type.
 *
 * The field names mirror the CCD model in `sptribs-case-api`
 * (`uk.gov.hmcts.sptribs.wpaf1.model`) so that `caseDataFrom` is a mechanical
 * prefix-and-capitalise rather than a translation table nobody can check.
 */

export type Nation = "england" | "wales" | "scotland" | "northernIreland";

/**
 * Which compensation scheme the decision was made under.
 *
 * The date of the injury decides it: the War Pensions Scheme covers service before
 * 6 April 2005, the Armed Forces Compensation Scheme on or after. It is not a
 * preference — it decides whether Section 6 (reconsideration) applies at all.
 */
export type Scheme = "warPension" | "afcs";

export type ServiceStatus = "stillServing" | "leftService";

/** WPAF1 question 4.2 — the grounds, which map onto the PAT Act 1943 categories. */
export type AppealType = "entitlement" | "awardLevel" | "awardStartDate" | "awardChanges" | "awardLabel" | "other";

/**
 * The only two grounds on which an appointee may sign for the appellant.
 *
 * The appellant is under 16, or cannot sign because of mental or physical infirmity.
 * There is no third case, so capturing which one applies is what makes the signature
 * checkable rather than asserted.
 */
export type SigningGround = "underSixteen" | "infirmity";

/** Whether the appeal is the signatory's own, which chooses the declaration's wording. */
export type DeclarationCapacity = "appellantSigning" | "signingOnBehalf";

export type SignatoryRole = "appellant" | "representative" | "appointee";

export type YesOrNo = "Yes" | "No";

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  townOrCity?: string;
  county?: string;
  postcode?: string;
}

/** An ISO date, or the parts of one the citizen has typed so far. */
export interface DateAnswer {
  day?: string;
  month?: string;
  year?: string;
}

export interface EvidenceRow {
  evidenceDescription?: string;
  signedBy?: string;
  documentDate?: DateAnswer;
  pageCount?: string;
}

export interface AppealDraft {
  appellant: {
    livesIn?: Nation;
    title?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: DateAnswer;
    nationalInsuranceNumber?: string;
    afcsMemberNumber?: string;
    address?: Address;
    phoneNumber?: string;
    mobileNumber?: string;
    emailAddress?: string;
    serviceStatus?: ServiceStatus;
    proposedDischargeDate?: DateAnswer;
  };
  representative: {
    hasRepresentative?: YesOrNo;
    firstName?: string;
    lastName?: string;
    organisation?: string;
    address?: Address;
    dxNumber?: string;
    referenceNumber?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    emailAddress?: string;
  };
  appointee: {
    hasAppointee?: YesOrNo;
    firstName?: string;
    lastName?: string;
    organisation?: string;
    address?: Address;
    phoneNumber?: string;
    mobileNumber?: string;
    emailAddress?: string;
    signingGround?: SigningGround;
  };
  decision: {
    scheme?: Scheme;
    decisionLetterDate?: DateAnswer;
    appealAbout?: AppealType[];
    appealAboutOther?: string;
  };
  reasons: {
    appealReasons?: string;
  };
  reconsideration: {
    askedForReconsideration?: YesOrNo;
  };
  timeliness: {
    lateAppealExplanation?: string;
  };
  support: {
    needsSupport?: YesOrNo;
    supportDetails?: string;
  };
  uksf: {
    servedWithUksf?: YesOrNo;
    disclosureCellConfirmed?: YesOrNo;
  };
  declaration: {
    capacity?: DeclarationCapacity;
    signatoryRole?: SignatoryRole;
    fullName?: string;
    signature?: string;
    dateSigned?: DateAnswer;
  };
  supportingEvidence: EvidenceRow[];
  /** Ticked on the documents-checklist page; not sent to CCD. */
  documentsChecklist: {
    decisionLetter?: boolean;
    evidenceList?: boolean;
  };
}

/** The section keys, which are also the task-list group ids. */
export type AppealSection = keyof Omit<AppealDraft, "supportingEvidence" | "documentsChecklist">;

export function emptyDraft(): AppealDraft {
  return {
    appellant: {},
    representative: {},
    appointee: {},
    decision: {},
    reasons: {},
    reconsideration: {},
    timeliness: {},
    support: {},
    uksf: {},
    declaration: {},
    supportingEvidence: [],
    documentsChecklist: {}
  };
}
