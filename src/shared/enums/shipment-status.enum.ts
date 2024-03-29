/**
 * Enum representing the status of a shipment.
 */
export enum ShipmentStatus {
    // The shipment is pending.
    PENDING = 'PENDING',
    // The shipment is in progress.
    IN_PROGRESS = 'IN_PROGRESS',
    // The shipment has been delivered.
    DELIVERED = 'DELIVERED',
    // The shipment has failed.
    FAILED = 'FAILED',
}