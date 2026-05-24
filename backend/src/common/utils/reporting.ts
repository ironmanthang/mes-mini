export interface ReportDateRange {
    startDate?: Date;
    endDate?: Date;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getSingleQueryValue = (value: unknown, fieldName: string): string | undefined => {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) {
        if (value.length !== 1) throw new Error(`${fieldName} must be supplied only once.`);
        return getSingleQueryValue(value[0], fieldName);
    }
    if (typeof value !== 'string') throw new Error(`${fieldName} must be a string.`);
    return value;
};

const parseDateOnly = (value: unknown, fieldName: string): Date | undefined => {
    const text = getSingleQueryValue(value, fieldName);
    if (!text) return undefined;
    if (!DATE_ONLY_PATTERN.test(text)) throw new Error(`${fieldName} must use YYYY-MM-DD format.`);

    const date = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error(`${fieldName} must be a valid date.`);
    return date;
};

export const parsePositiveIntQuery = (value: unknown, fieldName: string): number | undefined => {
    const text = getSingleQueryValue(value, fieldName);
    if (!text) return undefined;

    const parsed = Number(text);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${fieldName} must be a positive integer.`);
    }
    return parsed;
};

export const parseReportDateRange = (query: { startDate?: unknown; endDate?: unknown }): ReportDateRange => {
    const startDate = parseDateOnly(query.startDate, 'startDate');
    const endDateRaw = parseDateOnly(query.endDate, 'endDate');
    let endDate: Date | undefined;

    if (endDateRaw) {
        endDate = new Date(endDateRaw);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
    }

    if (startDate && endDate && startDate >= endDate) {
        throw new Error('startDate must be before or equal to endDate.');
    }

    return { startDate, endDate };
};

export const toDateKey = (value: Date): string => value.toISOString().slice(0, 10);

export const toNumber = (value: unknown): number => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);

    const withToNumber = value as { toNumber?: () => number };
    if (typeof withToNumber.toNumber === 'function') return withToNumber.toNumber();

    return Number(value);
};

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const roundRate = (value: number): number => Math.round((value + Number.EPSILON) * 10000) / 100;
