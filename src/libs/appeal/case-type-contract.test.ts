import { describe, expect, it } from "vitest";
import { en as declaration } from "../../pages/(citizen)/appeal/(declaration)/declaration.i18n.js";
import { en as serviceStatus } from "../../pages/(citizen)/appeal/(service-status)/service-status.i18n.js";
import { en as whatYouAreAppealing } from "../../pages/(citizen)/appeal/(what-you-are-appealing)/what-you-are-appealing.i18n.js";
import { en as whereDoYouLive } from "../../pages/(citizen)/appeal/(where-do-you-live)/where-do-you-live.i18n.js";
import { en as whichScheme } from "../../pages/(citizen)/appeal/(which-scheme)/which-scheme.i18n.js";
import { en as whoIsAppealing } from "../../pages/(citizen)/appeal/(who-is-appealing)/who-is-appealing.i18n.js";

/**
 * Every option this service offers is a code the StWpaf1 fixed lists accept.
 *
 * `case-data.test.ts` pins the field *ids*, and that is not enough. A value CCD does not
 * recognise fails the **whole** submission with a 422 — `Case data validation failed: the
 * following list of fields are in an invalid state: [declCapacity]` — while the field id in
 * that message is perfectly correct. Nothing in this service notices: the page renders, the
 * answer saves to the draft, the hub says the appeal is ready, and it dies at the declaration.
 *
 * This caught two live mismatches when it was written: `declaration.capacity` offered
 * `self`/`onBehalf` against the case type's `appellantSigning`/`signingOnBehalf`, and the
 * appeal grounds offered `label` against `awardLabel`. The first broke every submission; the
 * second broke only appeals about the medical label, which is why no test reached it.
 *
 * The accepted codes below are the `ListElementCode`s from
 * `build/definitions/StWpaf1/FixedLists/*.json`, regenerated with `./gradlew
 * generateCCDConfig` in `sptribs-case-api`. Pin them by hand; reading them at test time
 * would mean this suite could only run with that repo checked out beside this one.
 */
const ACCEPTED: Record<string, string[]> = {
  StWpaf1AppealType: ["awardChanges", "awardLabel", "awardLevel", "awardStartDate", "entitlement", "other"],
  StWpaf1DeclarationCapacity: ["appellantSigning", "signingOnBehalf"],
  StWpaf1Nation: ["england", "northernIreland", "scotland", "wales"],
  StWpaf1Scheme: ["afcs", "warPension"],
  StWpaf1ServiceStatus: ["leftService", "stillServing"],
  StWpaf1SignatoryRole: ["appellant", "appointee", "representative"],
  StWpaf1SigningGround: ["infirmity", "underSixteen"]
};

/**
 * Answers the journey uses to route but never stores, so no fixed list has to accept them.
 * Keep this list short and explain each one — it is the only way a genuine mismatch can hide.
 */
const NOT_STORED = [
  // `/appeal/which-scheme` offers it so somebody who does not know can be given the
  // 6 April 2005 rule rather than an error. It routes back to the same question.
  "notSure"
];

type Option = { value: string };

function values(options: readonly Option[]): string[] {
  return options.map((option) => option.value).filter((value) => !NOT_STORED.includes(value));
}

const CHOICES: { page: string; field: string; list: string; offered: string[] }[] = [
  { page: "where-do-you-live", field: "appLivesIn", list: "StWpaf1Nation", offered: values(whereDoYouLive.livesInOptions) },
  { page: "which-scheme", field: "dsnScheme", list: "StWpaf1Scheme", offered: values(whichScheme.schemeOptions) },
  { page: "service-status", field: "appServiceStatus", list: "StWpaf1ServiceStatus", offered: values(serviceStatus.serviceStatusOptions) },
  {
    page: "what-you-are-appealing",
    field: "dsnAppealAbout",
    list: "StWpaf1AppealType",
    offered: values(whatYouAreAppealing.appealAboutOptions)
  },
  { page: "who-is-appealing", field: "declCapacity", list: "StWpaf1DeclarationCapacity", offered: values(whoIsAppealing.capacityOptions) },
  { page: "declaration", field: "declCapacity", list: "StWpaf1DeclarationCapacity", offered: values(declaration.capacityOptions) },
  { page: "declaration", field: "declSignatoryRole", list: "StWpaf1SignatoryRole", offered: values(declaration.signatoryRoleOptions) },
  { page: "declaration", field: "aptSigningGround", list: "StWpaf1SigningGround", offered: values(declaration.signingGroundOptions) }
];

describe("the StWpaf1 fixed-list contract", () => {
  it.each(CHOICES)("should offer $field values the case type accepts, on $page", ({ page, field, list, offered }) => {
    expect(offered, `${page} offers no options for ${field}, so this is not checking anything`).not.toEqual([]);

    const rejected = offered.filter((value) => !ACCEPTED[list].includes(value));

    expect(
      rejected,
      `${page} offers these for ${field}, which ${list} does not accept, so CCD would reject the whole ` +
        `appeal with a 422 naming ${field}. Accepted: ${ACCEPTED[list].join(", ")}`
    ).toEqual([]);
  });

  it("should ask about every ground the case type knows, so none is unreachable", () => {
    // The reverse direction: a ground the case type declares but no page offers cannot be
    // appealed at all, which is a quieter failure than a 422 and only a caseworker would see it.
    const offered = values(whatYouAreAppealing.appealAboutOptions);
    expect([...offered].sort()).toEqual([...ACCEPTED.StWpaf1AppealType].sort());
  });

  it("should route every scheme the case type knows", () => {
    const offered = values(whichScheme.schemeOptions);
    expect([...offered].sort()).toEqual([...ACCEPTED.StWpaf1Scheme].sort());
  });
});
