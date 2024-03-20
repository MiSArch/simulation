import { IsString, IsUUID } from 'class-validator';

export class UpdatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsString()
  readonly status: string;
}
