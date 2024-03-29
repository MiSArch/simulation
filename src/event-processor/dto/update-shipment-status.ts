import { IsString, IsUUID } from 'class-validator';
import { ShipmentStatus } from 'src/shared/enums/shipment-status.enum';

/**
 * The DTO for updating the shipment status.
 * @property shipmentId The id of the shipment to update.
 * @property shipmentStatus The new status of the shipment.
 */
export class UpdateShipmentStatusDto {
  @IsUUID()
  readonly shipmentId: string;
  @IsString()
  readonly shipmentStatus: ShipmentStatus;
}
