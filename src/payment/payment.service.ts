import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentRepository } from './payment.repository';
import { ConnectorService } from 'src/connector/connector.service';
import { Payment } from './entitites/payment.entity';

/**
 * Service for simulating payments.
 */
@Injectable()
export class PaymentService {
  private paymentRepository: PaymentRepository;

  constructor(
    // RabbitMQ Client
    @Inject('PAYMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
    private readonly connectorService: ConnectorService,
  ) {
    this.paymentRepository = new PaymentRepository();
  }

  /**
   * Registers a payment with the simulation.
   * @param data - The payment data.
   */
  async register(data: CreatePaymentDto): Promise<void> {
    this.logger.log('Registering payment');
    // queue event for later processing
    this.client.emit('register-payment', data);
    // store payment in memory for manual updates
    this.paymentRepository.create({
      id: data.paymentId,
      paymentType: data.paymentType,
      blocked: false,
    });
    return;
  }

  /**
   * Updates a payment after manual request.
   * @param data - The updated payment data.
   */
  async update(data: UpdatePaymentDto): Promise<void> {
    this.logger.log(
      `Manually updating payment: ${data.paymentId} -> ${data.status}`,
    );
    if (!this.paymentRepository.findById(data.paymentId)) {
      this.logger.error(`Shipment not found: ${data.paymentId}`);
      throw new NotFoundException('Shipment not found');
    }

    // block shipment for automatic updates
    this.paymentRepository.update(data.paymentId, { blocked: true });

    // send update to shipment
    this.connectorService.sendUpdateToPayment({
      paymentId: data.paymentId,
      status: data.status,
    });
  }

  /**
   * Finds all payments.
   */
  findAll(): Payment[] {
    return this.paymentRepository.findAll();
  }

  /**
   * Checks if a payment is blocked for automatic processing.
   * @param paymentId - The ID of the payment to check.
   * @returns True if the payment is blocked, false otherwise.
   * @throws NotFoundException if the payment is not found.
   */
  isBlocked(paymentId: string): boolean {
    const payment = this.paymentRepository.findById(paymentId);
    if (!payment) {
      // can happen if simulation service was restarted
      this.logger.error(`Payment not found: ${paymentId}`);
      return false;
    }

    // remove payment from memory since it will be processed
    this.paymentRepository.delete(paymentId);
    return payment.blocked;
  }
}
