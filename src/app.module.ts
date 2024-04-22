import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { ShipmentModule } from './shipment/shipment.module';
import { EventProcessorModule } from './event-processor/event-processor.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { ConnectorModule } from './connector/connector.module';

/**
 * The root module of the application.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PaymentModule,
    ShipmentModule,
    EventProcessorModule,
    HealthModule,
    ScheduleModule.forRoot(),
    ConnectorModule,
  ],
})
export class AppModule {}
