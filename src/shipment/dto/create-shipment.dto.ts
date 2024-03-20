import { IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  readonly shipmentId: string;
}
