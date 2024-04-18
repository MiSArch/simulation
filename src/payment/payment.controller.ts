import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

/**
 * The controller for the payment service.
 */
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/register')
  async register(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.register(createPaymentDto);
  }

  @Post('/update')
  async update(@Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(updatePaymentDto);
  }
}
