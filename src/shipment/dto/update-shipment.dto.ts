import { IsString, IsUUID } from 'class-validator';
import { ShipmentStatus } from 'src/shared/enums/shipment-status.enum';

/**
 * The DTO for manually updating the shipment status.
 * @property shipmentId The id of the shipment to update.
 * @property status The new status of the shipment.
 */
export class UpdateShipmentDto {
  @IsUUID()
  readonly shipmentId: string;
  @IsString()
  readonly status: ShipmentStatus;
}
