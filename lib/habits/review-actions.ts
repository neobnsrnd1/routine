"use server";

import { getReviewData, type ReviewPeriodType } from "./review";

export async function getReviewDataAction(
  period: ReviewPeriodType,
  referenceDate: string,
  timeZone: string,
) {
  return getReviewData(period, referenceDate, timeZone);
}
