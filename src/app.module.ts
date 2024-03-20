import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { ShipmentModule } from './shipment/shipment.module';
import { PaymentListenerModule } from './payment-listener/payment-listener.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PaymentModule,
    ShipmentModule,
    PaymentListenerModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
