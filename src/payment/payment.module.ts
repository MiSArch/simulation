import { Logger, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectorModule } from 'src/connector/connector.module';

/**
 * The module for the payment service.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'NOT_SET')],
            queue: 'payments-queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ConnectorModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, Logger],
  exports: [PaymentService],
})
export class PaymentModule {}
