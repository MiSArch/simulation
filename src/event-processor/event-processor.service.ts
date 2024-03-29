import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as amqp from 'amqplib';
import { ConnectorService } from './connector.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';
import { ShipmentStatus } from 'src/shared/enums/shipment-status.enum';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status';
// import { ConnectionService } from './connection.service'; // Adjust import path as needed

/**
 * The service to process events from the respective queues.
 * @property processingTime The upper limit of simulated processing time
 * @property connection The current RabbitMQ connection
 * @property queues An array containing all queue identifiers, to connect to
 * @property maxMessages The rate limit for each queue per minute
 * @property messageCounts The current message count
 * @property booolean flag
 */
@Injectable()
export class EventProcessorService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly processingTime: number;
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private queues = ['payments-queue', 'shipments-queue'];
  private maxMessages: number;
  private successRate: number;
  private messageCounts: { [key: string]: number } = {};
  private processingAllowed: { [key: string]: boolean } = {};

  constructor(
    private readonly logger: Logger,
    private configService: ConfigService,
    private connectorService: ConnectorService,
  ) {
    // read configuration from environment variables
    this.processingTime = this.configService.get<number>(
      'PROCESSING_TIME_SECONDS',
      5000,
    );
    this.maxMessages = this.configService.get<number>(
      'PAYMENTS_PER_MINUTE',
      100,
    );
    this.successRate =  this.configService.get<number>(
      'SUCCESS_RATE',
      0.95,
    );

    // setup queue variables
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });
  }

  async onModuleInit() {
    await this.connectToRabbitMQ();
    this.queues.forEach((queue) => this.initializeConsumer(queue));
  }

  /**
   * connects to the RabbitMQ Queue
   */
  private async connectToRabbitMQ() {
    const rabbitmqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost',
    );
    try {
      // Establish a connection to the RabbitMQ server
      this.connection = await amqp.connect(rabbitmqUrl);
      // Create a channel for querying
      this.channel = await this.connection.createChannel();

      // Assert queues to ensure they exist. If they do not, they are created.
      this.queues.forEach(async (queue) => {
        await this.channel.assertQueue(queue, {
          durable: true,
        });
      });

      this.logger.log('Connected to RabbitMQ.');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      // retry in 5 seconds
      setTimeout(this.connectToRabbitMQ, 5)
    }
  }

  /**
   * Initializes the event consuming for a queue
   * @param queue the queue identifier
   */
  private initializeConsumer(queue: string) {
    this.channel.consume(
      queue,
      (msg) => {
        if (msg && this.processingAllowed[queue]) {
          const message = msg.content.toString();
          this.logger.debug(
            `[${queue}] Processing message: ${message} [${this.messageCounts[queue] + 1}/${this.maxMessages}]`,
          );
          this.channel.ack(msg);
          this.messageCounts[queue]++;
          // randomise timeout to simulate processing
          const delay = Math.floor(Math.random() * this.processingTime);
          this.logger.log(`[${queue}] Sending Event Update after [${delay}]s`);
          // Wait for the set amount of time
          setTimeout(() => { this.buildEventUpdate(queue, message) }, delay);

          if (this.messageCounts[queue] >= this.maxMessages) {
            this.logger.debug(
              `[${queue}] Maximum message count reached. Pausing processing until reset.`,
            );
            this.processingAllowed[queue] = false;
          }
        }
      },
      { noAck: false },
    );
  }

  /**
   * Builds the DTOs for the updated event for each queue
   * @param queueName The string identifier of the queue
   * @param msg The received message
   */
  private buildEventUpdate(queueName: string, msg: any) {
    // flip successfull event with given sucess rate
    const successfull: boolean = Math.random() < this.successRate;
    switch (queueName) {
      case 'payments-queue':
        const paymentStatus = successfull ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED
        const paymentDto: UpdatePaymentStatusDto = {
          paymentId: msg.paymentId,
          paymentStatus
        }
        this.connectorService.sendUpdateToPayment(paymentDto);
        break;
      
      case 'shipments-queue':
        const shipmentStatus = successfull ? ShipmentStatus.DELIVERED : ShipmentStatus.FAILED;
        const shipmentDto: UpdateShipmentStatusDto = {
          shipmentId: msg.shipmentId,
          shipmentStatus
        }
        this.connectorService.sendUpdateToShipment(shipmentDto)
        break;
    }
  }

  /**
   * Resets all rate limits every minute
   */
  @Cron('0 * * * * *')
  resetMessageCounts() {
    this.logger.debug(`Resetting message counts.`);
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });
    // TODO reset channel if limited before, so old messages get resend
    // Or figure out way, to retry from rabbitmq
  }

  /**
   * Ensures all RabbitMQ connections and channels are properly closed on shutdown
   */
  async onApplicationShutdown() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
