import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_SERVICE')
    private readonly client: ClientProxy,
    private readonly logger: Logger,
  ) {}

  async register(data: CreatePaymentDto) {
    this.logger.log('Registering payment');
    this.client.emit('register-payment', data);
    return;
  }

  async update(data: UpdatePaymentDto) {
    this.logger.log(`Manually updating payment: ${data}`);
  }
}
