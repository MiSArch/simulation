/**
 * Represents a payment.
 * @property id The id of the payment.
 * @property paymentType The type of the payment.
 * @property blocked wether the payment is blocked for automatic processing.
 */
export interface Payment {
  id: string;
  paymentType: string;
  blocked: boolean;
}
