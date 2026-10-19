/**
 * Billing's refusal of a renewal, in a phrase the customer can act on.
 *
 * Takes the raw `code: message` from `toApiError`. Only the refusal that has a
 * different remedy gets its own text; everything else keeps the general one.
 */
export function renewalErrorMessage(
  raw: string | null | undefined,
  text: { renewError: string; renewUpgradeInProgress: string },
): string {
  const code = (raw ?? '').split(':')[0].trim();
  return code === 'upgrade_in_progress' ? text.renewUpgradeInProgress : text.renewError;
}
