import { IsInt, IsString, IsUUID } from 'class-validator';

/**
 * The DTO for a payment creation event.
 * @property paymentId The id of the payment.
 * @property amount The amount of the payment.
 * @property paymentType The type of the payment.
 */
export class CreatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsInt()
  readonly amount: number;
  @IsString()
  readonly paymentType: string;
}
