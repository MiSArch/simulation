import { IsString, IsUUID } from 'class-validator';
import { ShipmentStatus } from 'src/shared/enums/shipment-status.enum';

export class UpdateShipmentStatusDto {
  @IsUUID()
  readonly shipmentId: string;
  @IsString()
  readonly shipmentStatus: ShipmentStatus;
}
