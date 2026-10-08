import prisma from "@/lib/db/prisma";
import { legalLocale, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

export function latestConsent(rows, documentType) {
  const matches = (rows || []).filter((row) => row.documentType === documentType);
  matches.sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt));
  return matches[0] || null;
}

export function consentIsCurrent(rows) {
  const terms = latestConsent(rows, "terms");
  const privacy = latestConsent(rows, "privacy");
  return (
    terms?.version === TERMS_VERSION && privacy?.version === PRIVACY_VERSION
  );
}

export async function readConsentState(userId) {
  const rows = await prisma.legalConsent.findMany({
    where: { userId },
    orderBy: { acceptedAt: "desc" },
  });
  return {
    current: consentIsCurrent(rows),
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    acceptedTerms: latestConsent(rows, "terms")?.version || null,
    acceptedPrivacy: latestConsent(rows, "privacy")?.version || null,
  };
}

export async function assertCurrentConsent(userId) {
  const state = await readConsentState(userId);
  if (state.current) return state;
  const err = new Error("Нужно принять обновлённые условия.");
  err.status = 403;
  err.code = "CONSENT_REQUIRED";
  throw err;
}

/** Append-only. Older rows stay. */
export async function recordCurrentConsent(userId, locale) {
  const code = legalLocale(locale);
  await prisma.legalConsent.createMany({
    data: [
      { userId, documentType: "terms", version: TERMS_VERSION, locale: code },
      { userId, documentType: "privacy", version: PRIVACY_VERSION, locale: code },
    ],
  });
  return readConsentState(userId);
}
