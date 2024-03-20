import { IsInt, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  readonly paymentId: string;
  @IsInt()
  readonly amount: number;
  @IsString()
  readonly paymentType: string;
}
