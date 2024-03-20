import { IsString, IsUUID } from 'class-validator';

export class UpdateShipmentDto {
  @IsUUID()
  readonly shipmentId: string;
  @IsString()
  readonly status: string;
}
