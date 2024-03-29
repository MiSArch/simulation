import { Inject, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

/**
 * Service for simulating shipments.
 */
@Injectable()
export class ShipmentService {
  constructor(
    // RabbitMQ Client
    @Inject('SHIPMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
  ) {}


  /**
   * Registers a shipment with the simulation.
   * @param data - The shipment data.
   */
  async register(data: CreateShipmentDto) {
    this.logger.log(`Registering shipment: ${JSON.stringify(data)}}`);
    // queue event for later processing
    this.client.emit('register-shipment', data);
    return;
  }

  /**
   * Updates a shipment after manual request.
   * @param data - The updated shipment data.
   */
  async update(data: UpdateShipmentDto) {
    this.logger.log(`Manually updating shipment: ${data}`);
    throw new NotImplementedException();
  }
}
