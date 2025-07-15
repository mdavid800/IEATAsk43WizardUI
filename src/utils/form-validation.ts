import { IEATask43Schema } from '../types/schema';

// Store form-only fields for validation
export interface FormValidationData {
    campaignStatus?: 'live' | 'historical';
    startDate?: string;
    endDate?: string;
}

/**
 * Extract form-only fields from the full schema for validation purposes
 */
export const extractFormValidationData = (data: IEATask43Schema): FormValidationData => {
    return {
        campaignStatus: data.campaignStatus,
        startDate: data.startDate,
        endDate: data.endDate
    };
};

/**
 * Validate that campaign dates are logically consistent
 */
export const validateCampaignDates = (formData: FormValidationData): {
    valid: boolean;
    message?: string;
} => {
    if (!formData.startDate || !formData.endDate) {
        return { valid: true }; // Optional fields
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
        return {
            valid: false,
            message: 'Campaign end date must be after start date'
        };
    }

    return { valid: true };
};

/**
 * Validate that a live campaign has appropriate date constraints
 */
export const validateLiveCampaign = (formData: FormValidationData): {
    valid: boolean;
    message?: string;
} => {
    if (formData.campaignStatus !== 'live') {
        return { valid: true };
    }

    // If campaign is live, end date should be in the future or null
    if (!formData.endDate) {
        return { valid: true };
    }

    const end = new Date(formData.endDate);
    const now = new Date();

    if (end <= now) {
        return {
            valid: false,
            message: 'Live campaign end date should be in the future'
        };
    }

    return { valid: true };
};

/**
 * Validate that a historical campaign has required end date
 */
export const validateHistoricalCampaign = (formData: FormValidationData): {
    valid: boolean;
    message?: string;
} => {
    if (formData.campaignStatus !== 'historical') {
        return { valid: true };
    }

    if (!formData.endDate) {
        return {
            valid: false,
            message: 'Historical campaign must have an end date'
        };
    }

    const end = new Date(formData.endDate);
    const now = new Date();

    if (end > now) {
        return {
            valid: false,
            message: 'Historical campaign end date should be in the past'
        };
    }

    return { valid: true };
};

/**
 * Comprehensive validation of all form-only fields
 */
export const validateFormOnlyFields = (data: IEATask43Schema): {
    valid: boolean;
    issues: string[];
} => {
    const formData = extractFormValidationData(data);
    const issues: string[] = [];

    // Validate required fields
    if (!formData.startDate) {
        issues.push('Campaign start date is required');
    }

    if (!formData.campaignStatus) {
        issues.push('Campaign status is required');
    }

    // Validate campaign dates consistency
    const dateValidation = validateCampaignDates(formData);
    if (!dateValidation.valid && dateValidation.message) {
        issues.push(dateValidation.message);
    }

    // Validate live campaign constraints
    const liveValidation = validateLiveCampaign(formData);
    if (!liveValidation.valid && liveValidation.message) {
        issues.push(liveValidation.message);
    }

    // Validate historical campaign constraints
    const historicalValidation = validateHistoricalCampaign(formData);
    if (!historicalValidation.valid && historicalValidation.message) {
        issues.push(historicalValidation.message);
    }

    return {
        valid: issues.length === 0,
        issues
    };
};

/**
 * Get a human-readable description of campaign duration
 */
export const getCampaignDurationDescription = (formData: FormValidationData): string => {
    if (!formData.startDate) return 'No start date specified';

    const start = new Date(formData.startDate);
    const startStr = start.toLocaleDateString();

    if (!formData.endDate) {
        return `Campaign started ${startStr} (ongoing)`;
    }

    const end = new Date(formData.endDate);
    const endStr = end.toLocaleDateString();

    // Calculate duration
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
        return `Campaign: ${startStr} to ${endStr} (same day)`;
    } else if (diffDays < 7) {
        return `Campaign: ${startStr} to ${endStr} (${diffDays} days)`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        const remainingDays = diffDays % 7;
        const weekStr = weeks === 1 ? 'week' : 'weeks';
        return `Campaign: ${startStr} to ${endStr} (${weeks} ${weekStr}${remainingDays > 0 ? ` ${remainingDays} days` : ''})`;
    } else {
        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;
        const monthStr = months === 1 ? 'month' : 'months';
        return `Campaign: ${startStr} to ${endStr} (${months} ${monthStr}${remainingDays > 0 ? ` ${remainingDays} days` : ''})`;
    }
}; 