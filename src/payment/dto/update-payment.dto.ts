import { IsString, IsUUID } from 'class-validator';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';

/**
 * The DTO for manual payment updates.
 * @property paymentId The id of the payment to update.
 * @property status The new status of the payment.
 */
export class UpdatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsString()
  readonly status: PaymentStatus;
}
