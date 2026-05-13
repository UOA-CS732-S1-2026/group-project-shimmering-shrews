import { Request, Response } from 'express';
import { addLocations, fetchLocations } from '../services/locationService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/httpResponse';
import { ApiError } from '../utils/ApiError';

// Query values can arrive as strings, arrays, or missing values. Normalizing at
// the controller layer gives the contract tests one place to verify malformed
// input is rejected before the Geoapify service builds an outbound URL.
const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return undefined
  }

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

// Geoapify categories are used directly in the outbound API query. Keep the
// accepted shape intentionally small and tested so path-like or script-like
// category strings are not passed through to external requests.
const parseOptionalCategory = (value: unknown) => {
  const category = getSingleQueryValue(value)

  if (!category) {
    return undefined
  }

  if (!/^[a-z]+(?:[._-][a-z]+)*$/i.test(category)) {
    throw new ApiError(400, 'category must be a valid Geoapify category')
  }

  return category
}

// Limit validation is kept in the controller because it is part of the HTTP
// contract, not business logic. Tests assert invalid limits never reach the
// service layer.
const parseOptionalLimit = (value: unknown) => {
  const rawValue = getSingleQueryValue(value)

  if (!rawValue) {
    return undefined
  }

  const limit = Number(rawValue)

  if (!Number.isInteger(limit) || limit < 1) {
    throw new ApiError(400, 'limit must be a positive integer')
  }

  return limit
}

// Fetches locations from Geoapify without saving them to the database.
// Useful for previewing what locations would be returned before committing them.
export const fetchPlaces = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = parseOptionalCategory(req.query?.category)
  const limit = parseOptionalLimit(req.query?.limit)
  const data = await fetchLocations(category, limit);

  // Location controller tests assert this action-style message while still using
  // the shared success envelope.
  sendSuccess(res, data, 'Locations fetched');
});

// Fetches locations from Geoapify and saves new ones to the database.
// Skips duplicates automatically via the DAO layer.
export const fetchAndCreateLocations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = parseOptionalCategory(req.query?.category)
  const limit = parseOptionalLimit(req.query?.limit)
  const data = await addLocations(category, limit);

  // This mirrors fetchPlaces so both location flows are covered by one response
  // contract: success, data, and an optional action message.
  sendSuccess(res, data, 'Locations added to database');
});
