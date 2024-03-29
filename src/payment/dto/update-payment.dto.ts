import { IsString, IsUUID } from 'class-validator';

/**
 * The DTO for manual payment updates.
 * @property paymentId The id of the payment to update.
 * @property status The new status of the payment.
 */
export class UpdatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsString()
  readonly status: string;
}
