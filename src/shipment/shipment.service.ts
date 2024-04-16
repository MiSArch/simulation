import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentRepository } from './shipment.repository';
import { ConnectorService } from 'src/connector/connector.service';

/**
 * Service for simulating shipments.
 */
@Injectable()
export class ShipmentService {
  private shipmentRepository: ShipmentRepository;

  constructor(
    // RabbitMQ Client
    @Inject('SHIPMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
    private readonly connectorService: ConnectorService,
  ) {
    this.shipmentRepository = new ShipmentRepository();
  }

  /**
   * Registers a shipment with the simulation.
   * @param data - The shipment data.
   */
  async register(data: CreateShipmentDto) {
    this.logger.log(`Registering shipment: ${JSON.stringify(data)}}`);
    // store shipment in memory for manual updates
    this.shipmentRepository.create({
      id: data.shipmentId,
      blocked: false,
    });
    // queue event for later processing
    this.client.emit('register-shipment', data);
    return;
  }

  /**
   * Updates a shipment after manual request.
   * @param data - The updated shipment data.
   */
  async update(data: UpdateShipmentDto) {
    this.logger.log(`Manually updating shipment: ${data.shipmentId} -> ${data.status}`)

    if (!this.shipmentRepository.findById(data.shipmentId)) {
      this.logger.error(`Shipment not found: ${data.shipmentId}`);
      throw new NotFoundException('Shipment not found');
    }

    // block shipment for automatic updates
    this.shipmentRepository.update(data.shipmentId, { blocked: true });

    // send update to shipment
    this.connectorService.sendUpdateToShipment({
      shipmentId: data.shipmentId,
      status: data.status,
    });
  }

  async findAll() {
    return this.shipmentRepository.findAll();
  }

  /**
   * Checks if a payment is blocked for automatic processing.
   * @param paymentId - The ID of the payment to check.
   * @returns True if the payment is blocked, false otherwise.
   */
  isBlocked(shipmentId: string): boolean {
    this.logger.log(`Checking if shipment is blocked: ${shipmentId}`);
    const shipment = this.shipmentRepository.findById(shipmentId);
    if (!shipment) {
      // can happen if simulation service was restarted
      this.logger.error(`Shipment not found: ${shipmentId}`);
      return false;
    }

    // remove payment from memory since it will be processed
    this.shipmentRepository.delete(shipmentId);
    return shipment.blocked;
  }
}
