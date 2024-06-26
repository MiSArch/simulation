import { Logger, Module } from '@nestjs/common';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectorModule } from 'src/connector/connector.module';

/**
 * The module for the shipment service.
 */
@Module({
  imports: [
    ConnectorModule,
    // register the shipment service as a client for rabbitmq
    ClientsModule.registerAsync([
      {
        name: 'SHIPMENT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'NOT_SET')],
            queue: 'shipments-queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ShipmentController],
  providers: [ShipmentService, Logger],
  exports: [ShipmentService],
})
export class ShipmentModule {}
