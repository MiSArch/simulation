/**
 * Represents a shipment.
 * @property id The id of the shipment.
 * @property blocked wether the shipment is blocked for automatic processing.
 */
export interface Shipment {
  id: string;
  blocked: boolean;
}
