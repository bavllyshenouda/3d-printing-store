/**
 * Centralized pagination parsing utility.
 * Parses and bounds page and limit parameters from URL query parameters.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  minLimit?: number;
}

/**
 * Parses page and limit from URLSearchParams, enforcing bounds and returning { page, limit, offset }.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): PaginationParams {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100,
    minLimit = 1,
  } = options;

  const rawPage = parseInt(searchParams.get("page") ?? "", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : defaultPage;

  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
  const parsedLimit = Number.isInteger(rawLimit) ? rawLimit : defaultLimit;
  const limit = Math.min(maxLimit, Math.max(minLimit, parsedLimit));

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

