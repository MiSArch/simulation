import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { ShipmentModule } from './shipment/shipment.module';
import { EventProcessorModule } from './event-processor/event-processor.module';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * The root module of the application.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PaymentModule,
    ShipmentModule,
    EventProcessorModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
