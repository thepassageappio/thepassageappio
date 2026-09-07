import { AuthorityError } from "./errors.ts";

export type PilotInvoiceInput = {
  servicePeriodStart: string;
  servicePeriodEnd: string;
  requestAllowance: number;
};

function parseDateOnly(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AuthorityError(`${field} must be a calendar date.`, "INVALID_COMMAND", 409);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AuthorityError(`${field} must be a calendar date.`, "INVALID_COMMAND", 409);
  }
  return date;
}

export function preparePilotInvoice(input: PilotInvoiceInput, now = new Date()) {
  const start = parseDateOnly(input.servicePeriodStart, "Pilot start");
  const end = parseDateOnly(input.servicePeriodEnd, "Pilot end");
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  if (start < today) {
    throw new AuthorityError("Pilot start cannot be in the past.", "INVALID_COMMAND", 409);
  }
  if (durationDays < 60 || durationDays > 90) {
    throw new AuthorityError("The founding pilot must run for 60 to 90 days.", "INVALID_COMMAND", 409);
  }
  if (!Number.isInteger(input.requestAllowance) || input.requestAllowance < 1 || input.requestAllowance > 500) {
    throw new AuthorityError("Pilot request allowance must be between 1 and 500.", "INVALID_COMMAND", 409);
  }

  return {
    servicePeriodStart: input.servicePeriodStart,
    servicePeriodEnd: input.servicePeriodEnd,
    requestAllowance: input.requestAllowance,
    periodStartUnix: Math.floor(start.getTime() / 1000),
    periodEndUnix: Math.floor(end.getTime() / 1000),
  };
}

export function defaultPilotPeriod(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 90 * 86_400_000);
  return {
    servicePeriodStart: start.toISOString().slice(0, 10),
    servicePeriodEnd: end.toISOString().slice(0, 10),
  };
}
