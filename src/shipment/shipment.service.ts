import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentService {
  constructor(
    // RabbitMQ Client
    @Inject('SHIPMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
  ) {}

  async register(data: CreateShipmentDto) {
    this.logger.log(`Registering shipment: ${JSON.stringify(data)}}`);
    // queue event for later processing
    this.client.emit('register-shipment', data);
    return;
  }

  async update(data: UpdateShipmentDto) {
    this.logger.log(`Manually updating shipment: ${data}`);
  }
}
