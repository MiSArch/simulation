import { IsString, IsUUID } from 'class-validator';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';

/**
 * The DTO for updating the payment status.
 * @property paymentId The id of the payment to update.
 * @property paymentStatus The new status of the payment.
 */
export class UpdatePaymentStatusDto {
  @IsUUID()
  readonly paymentId: string;
  @IsString()
  readonly status: PaymentStatus;
}
