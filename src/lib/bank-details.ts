/**
 * Deposit beneficiary accounts from Clearing welcome letters (verbatim fields).
 * - UK: `Welcome Letter - NebTech Ltd - GBP (20260409).pdf`
 * - EU / international: `Welcome Letter - NebTech Ltd (20260313) (1).pdf`
 */

export const DEPOSIT_BANK_UK_GBP = {
  id: "uk" as const,
  title: "UK account (GBP)",
  accountName: "NebTech Ltd - GBP Account",
  accountNumber: "03494928",
  iban: "GB96CLRB04051103494928",
  bic: "CLRBGB22",
  sortCode: "04-05-11",
  /** Stated on the GBP welcome letter */
  currencyLine: "GBP",
} as const;

export const DEPOSIT_BANK_EU_IBAN = {
  id: "eu" as const,
  title: "Europe / international (IBAN)",
  accountName: "NebTech Ltd",
  accountNumber: "0047366806",
  iban: "DK6489000047366806",
  bic: "SXPYDKKK",
  bankName: "Banking Circle S.A.",
  bankAddress: "AMERIKA PLADS, 38 COPENHAGEN 2100 Denmark",
  /** Stated on the international welcome letter */
  currencyLine: "GBP, USD",
} as const;

export type DepositBankRailId =
  (typeof DEPOSIT_BANK_UK_GBP)["id"] | (typeof DEPOSIT_BANK_EU_IBAN)["id"];
