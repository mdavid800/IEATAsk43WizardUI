/**
 * Utility functions for managing campaign dates across the form
 */

export interface CampaignDates {
  startDate?: string;
  endDate?: string;
}

/**
 * Gets campaign dates from form data for prepopulating Date From/Date To fields
 */
export function getCampaignDates(formData: any): CampaignDates {
  return {
    startDate: formData?.startDate,
    endDate: formData?.endDate
  };
}

/**
 * Converts campaign start date to ISO datetime format for date_from fields
 */
export function getCampaignStartDateTime(formData: any): string {
  const startDate = formData?.startDate;
  if (!startDate) return new Date().toISOString();
  
  // If it's already a datetime, return as-is
  if (startDate.includes('T')) return startDate;
  
  // If it's just a date, add time component
  return `${startDate}T00:00:00`;
}

/**
 * Converts campaign end date to ISO datetime format for date_to fields
 */
export function getCampaignEndDateTime(formData: any): string | null {
  const endDate = formData?.endDate;
  if (!endDate) return null;
  
  // If it's already a datetime, return as-is
  if (endDate.includes('T')) return endDate;
  
  // If it's just a date, add time component (end of day)
  return `${endDate}T23:59:59`;
}

/**
 * Gets default dates for new entries - uses campaign dates if available, current time as fallback
 */
export function getDefaultDatesForNewEntry(formData: any): { date_from: string; date_to: string | null } {
  return {
    date_from: getCampaignStartDateTime(formData),
    date_to: getCampaignEndDateTime(formData)
  };
}