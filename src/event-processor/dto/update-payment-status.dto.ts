import { IsInt, IsString, IsUUID } from 'class-validator';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';

export class UpdatePaymentStatusDto {
  @IsUUID()
  readonly paymentId: string;
  @IsString()
  readonly paymentStatus: PaymentStatus
}

