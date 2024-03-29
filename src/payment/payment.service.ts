import {
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

/**
 * Service for simulating payments.
 */
@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
  ) {}

  /**
   * Registers a payment with the simulation.
   * @param data - The payment data.
   */
  async register(data: CreatePaymentDto) {
    this.logger.log('Registering payment');
    this.client.emit('register-payment', data);
    return;
  }

  /**
   * Updates a payment after manual request.
   * @param data - The updated payment data.
   */
  async update(data: UpdatePaymentDto) {
    this.logger.log(`Manually updating payment: ${data}`);
    throw new NotImplementedException();
  }
}
