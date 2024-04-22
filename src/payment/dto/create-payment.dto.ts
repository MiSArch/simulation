import { IsString, IsUUID, IsNumber } from 'class-validator';

/**
 * The DTO for a payment creation event.
 * @property paymentId The id of the payment.
 * @property paymentType The type of the payment.
 */
export class CreatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsNumber()
  readonly amount: number;
  @IsString()
  readonly paymentType: string;
}
