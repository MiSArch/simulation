import { Payment } from './entitites/payment.entity';

/**
 * Repository class for storing payments in memory.
 * It is needed besides the queue to keep track of the payments for manual updates.
 */
export class PaymentRepository {
  private payments: Payment[] = [];

  /**
   * Creates a new payment and adds it to the repository.
   * @param payment - The payment to be created.
   * @returns The created payment.
   */
  public create(payment: Payment): Payment {
    this.payments.push(payment);
    return payment;
  }

  /**
   * Finds a payment by its ID.
   * @param id - The ID of the payment to find.
   * @returns The found payment, or undefined if not found.
   */
  public findById(id: string): Payment | undefined {
    return this.payments.find((payment) => payment.id === id);
  }

  /**
   * Finds all payments.
   * @returns All payments.
   */
  public findAll(): Payment[] {
    return this.payments;
  }

  /**
   * Updates a payment with the provided ID.
   * @param id - The ID of the payment to update.
   * @param update - The partial payment object with the updated values.
   * @returns The updated payment, or undefined if the payment was not found.
   */
  public update(id: string, update: Partial<Payment>): Payment | undefined {
    const payment = this.findById(id);
    if (!payment) return undefined;
    Object.assign(payment, update);
    return payment;
  }

  /**
   * Deletes a payment with the provided ID.
   * @param id - The ID of the payment to delete.
   * @returns True if the payment was successfully deleted, false otherwise.
   */
  public delete(id: string): boolean {
    const initialLength = this.payments.length;
    this.payments = this.payments.filter((payment) => payment.id !== id);
    return this.payments.length < initialLength;
  }
}
