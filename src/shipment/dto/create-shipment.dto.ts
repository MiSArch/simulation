import { IsUUID } from 'class-validator';

/**
 * The DTO for a shipment creation event.
 * @property shipmentId The id of the shipment.
 */
export class CreateShipmentDto {
  @IsUUID()
  readonly shipmentId: string;
}
