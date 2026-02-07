/**
 * Utility for generating standard Barcode strings for the MES.
 * Format: {TYPE}-{CODE}-{TIMESTAMP/RANDOM}
 */

export enum BarcodeType {
    COMPONENT = 'COM',
    PRODUCT = 'PRD',
    LOCATION = 'LOC',
    WORK_ORDER = 'WO'
}

export const generateBarcode = (type: BarcodeType, code: string): string => {
    // Determine format based on type
    // Simple format: TYPE-CODE (e.g., COM-RESISTOR-001)
    // For serialization, we usually use the unique ID or Code from DB.

    // Clean code to be barcode friendly (uppercase, no spaces)
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    return `${type}-${cleanCode}`;
};

export const generateSerialBarcode = (productCode: string, batchCode: string, sequence: number): string => {
    // Format: SN-{PRD}-{BATCH}-{SEQ}
    const cleanPrd = productCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanBatch = batchCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const seqStr = sequence.toString().padStart(3, '0');

    return `SN-${cleanPrd}-${cleanBatch}-${seqStr}`;
};
