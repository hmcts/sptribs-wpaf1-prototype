import config from "config";
import type { Request, Response } from "express";
import { z } from "zod";
import { caseDataFrom, clearDraft, draftFrom, readyToSubmit, updateDraft } from "#appeal";
import { CcdError, sharedCcdClient } from "#ccd";
import { requireRole, saveSession } from "#oidc";
import { fieldErrors, parseDayMonthYear } from "#zod-validation";
import { cy, en } from "./declaration.i18n.js";

/**
 * The declaration, and the only page that writes to CCD.
 *
 * Everything up to here is a draft in the session; this is the moment the appeal becomes
 * a case. That ordering is deliberate — an appeal somebody abandons half way through
 * should leave no case behind for a caseworker to find and wonder about.
 *
 * Two WPAF1 rules are enforced here rather than described. The statement of truth has a
 * first-person and a third-person wording and the citizen picks the one that is true of
 * them, because a form that signs "I, the appellant" on behalf of somebody else is not a
 * statement of truth. And an appointee may sign only where the appellant is under 16 or
 * cannot sign through mental or physical infirmity, so choosing to sign as an appointee
 * makes the ground a required answer.
 *
 * The completeness check is repeated here rather than trusted from check-answers. A
 * citizen can reach this URL directly, and CCD would reject an incomplete appeal with a
 * validation error naming a field, which is not a thing to show anybody.
 */
const BACK = "/appeal/check-answers";
const NEXT = "/appeal/confirmation";
const MAX_NAME = 100;

/**
 * Shown when CCD refuses the appeal. Inline rather than in `declaration.i18n.ts` because the
 * template is shared under `_errors/` and the page content modules are spread flat onto the
 * view model, so the declaration's own strings would reach this page too.
 *
 * Every key the template reads is here. It renders a heading, a button and a link, and
 * leaving any of them out gives a button and a link with no accessible name — on the one
 * page whose whole job is telling somebody their appeal did not arrive.
 */
const submissionFailedLocals = {
  en: {
    title: "Your appeal was not sent",
    intro:
      "There was a problem sending your appeal to the tribunal. Your answers have been saved, so you can try again without filling anything in a second time.",
    tryAgain: "Try again",
    tryAgainHref: "/appeal/declaration",
    checkAnswers: "Check your answers before trying again",
    checkAnswersHref: "/appeal/check-answers"
  },
  cy: {
    title: "Your appeal was not sent",
    intro:
      "There was a problem sending your appeal to the tribunal. Your answers have been saved, so you can try again without filling anything in a second time.",
    tryAgain: "Try again",
    tryAgainHref: "/appeal/declaration",
    checkAnswers: "Check your answers before trying again",
    checkAnswersHref: "/appeal/check-answers"
  }
};

const schema = z.object({
  capacity: z.enum(["appellantSigning", "signingOnBehalf"], { message: "capacityRequired" }),
  signatoryRole: z.enum(["appellant", "representative", "appointee"], { message: "signatoryRoleRequired" }),
  fullName: z.string().trim().min(1, "fullNameRequired").max(MAX_NAME, "fullNameTooLong"),
  signature: z.string().trim().min(1, "signatureRequired").max(MAX_NAME, "signatureTooLong")
});

const signingGroundSchema = z.enum(["underSixteen", "infirmity"], { message: "signingGroundRequired" });

const getHandler = (req: Request, res: Response) => {
  const draft = draftFrom(req);
  render(
    res,
    {
      capacity: draft.declaration.capacity ?? "",
      signatoryRole: draft.declaration.signatoryRole ?? "",
      signingGround: draft.appointee.signingGround ?? "",
      fullName: draft.declaration.fullName ?? "",
      signature: draft.declaration.signature ?? "",
      "dateSigned-day": draft.declaration.dateSigned?.day ?? "",
      "dateSigned-month": draft.declaration.dateSigned?.month ?? "",
      "dateSigned-year": draft.declaration.dateSigned?.year ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const errors: Record<string, string> = {};
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    Object.assign(errors, fieldErrors(parsed.error));
  }

  // Only an appointee has a ground to give, and only an appointee has to.
  const signingAsAppointee = req.body.signatoryRole === "appointee";
  const signingGround = signingAsAppointee ? signingGroundSchema.safeParse(req.body.signingGround) : undefined;
  if (signingGround && !signingGround.success) {
    errors.signingGround = "signingGroundRequired";
  }

  const dateSigned = parseDayMonthYear(req.body, "dateSigned", { required: "dateSignedRequired", invalid: "dateSignedInvalid" });
  if (dateSigned.error) {
    errors.dateSigned = dateSigned.error;
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(res, req.body, errors);
  }

  await updateDraft(req, "declaration", {
    ...parsed.data,
    dateSigned: {
      day: String(req.body["dateSigned-day"] ?? "").trim(),
      month: String(req.body["dateSigned-month"] ?? "").trim(),
      year: String(req.body["dateSigned-year"] ?? "").trim()
    }
  });
  await updateDraft(req, "appointee", { signingGround: signingGround?.success ? signingGround.data : undefined });

  const draft = draftFrom(req);
  if (!readyToSubmit(draft)) {
    return res.redirect(302, "/appeal/check-answers");
  }

  const user = req.user;
  if (!user) {
    // Only reachable if the session expired between check-answers and here. Sending them
    // to sign in with a returnTo keeps the draft, which is still in the session store.
    req.session.returnTo = "/appeal/declaration";
    await saveSession(req.session);
    return res.redirect(302, "/login");
  }

  try {
    const created = await sharedCcdClient().createCase({
      caseType: caseTypeId(),
      event: createEvent(),
      data: caseDataFrom(draft),
      userToken: user.accessToken
    });

    // Kept for the confirmation page, then the draft goes: leaving it behind would let a
    // refresh of the journey submit the same appeal twice.
    req.session.submittedAppeal = {
      reference: created.reference,
      appellantName: [draft.appellant.firstName, draft.appellant.lastName].filter(Boolean).join(" ")
    };
    await clearDraft(req);
    res.redirect(302, NEXT);
  } catch (error) {
    if (error instanceof CcdError) {
      // Logged, because the citizen's page cannot say why and this is the only record that the
      // submission was attempted at all. Without it a failed submit leaves nothing in the pod
      // log and the investigation starts from "it just says it was not sent".
      console.error(`CCD refused the appeal (status ${error.status}): ${error.message}`);
      // The draft is untouched, so Try again resubmits exactly what they confirmed.
      return res.status(502).render("_errors/submission-failed", submissionFailedLocals);
    }
    throw error;
  }
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("declaration", { en, cy, values, errors, backHref: BACK });
}

// Read per call rather than at module load, so config is settled by the time it is asked.
const caseTypeId = () => config.get<string>("ccd.caseTypeId");
const createEvent = () => config.get<string>("ccd.createEvent");

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
