import type { Request, Response } from "express";
import { cy, en } from "./cannot-use-this-service.i18n.js";

/**
 * The dead end.
 *
 * One page rather than one per reason, because the shape is identical and the only thing
 * that differs is which paragraphs apply. `?reason=` selects them; an unrecognised reason
 * falls back to the general case, which says what this service covers and links the paper
 * form, rather than rendering a page with no explanation on it.
 *
 * No case is created here — nothing in this service writes to CCD before the declaration.
 */
const REASONS = en.reasons;
const BACK = "/appeal/where-do-you-live";

export const GET = (req: Request, res: Response) => {
  const requested = String(req.query.reason ?? "");
  const reason = requested in REASONS ? (requested as keyof typeof REASONS) : "general";
  res.render("cannot-use-this-service", { en, cy, reason: REASONS[reason], backHref: BACK });
};
