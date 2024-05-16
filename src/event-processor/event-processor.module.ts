import { Logger, Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { ConnectorModule } from 'src/connector/connector.module';
import { ShipmentModule } from 'src/shipment/shipment.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ConfigurationModule } from 'src/configuration/configuration.module';

/**
 * The module for the event processor service.
 */
@Module({
  imports: [
    ConnectorModule,
    ShipmentModule,
    PaymentModule,
    ConfigurationModule
  ],
  providers: [EventProcessorService, Logger],
})
export class EventProcessorModule {}
