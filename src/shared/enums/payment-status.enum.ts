/**
 * Enum representing the status of a payment.
 */
export enum PaymentStatus {
  // The payment was created but not yet processed
  OPEN = 'OPEN',
  // The payment is currently being processed
  PENDING = 'PENDING',
  // The payment was successfully processed
  SUCCEEDED = 'SUCCEEDED',
  // The payment processing failed indefinetely
  FAILED = 'FAILED',
  // The payment was sold to external inkasso service
  INKASSO = 'INKASSO',
}
