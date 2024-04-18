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
    this.successRate = this.configService.get<number>('SUCCESS_RATE', 0.95);

    // setup queue variables
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });
  }

  async onModuleInit() {
    let rabbitMQConnected: boolean = await this.connectToRabbitMQ();

    while (!rabbitMQConnected) {
      this.logger.debug('Retrying in 5 seconds.');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      rabbitMQConnected = await this.connectToRabbitMQ();
    }
    this.queues.forEach((queue) => this.initializeConsumer(queue));
  }

  /**
   * connects to the RabbitMQ Queue
   * @returns boolean that indicates if the connection was successful
   */
  private async connectToRabbitMQ(): Promise<boolean> {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
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
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      return false;
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
          setTimeout(() => {
            this.buildEventUpdate(queue, message);
          }, delay);

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
        const paymentStatus = successfull
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.FAILED;
        const paymentDto: UpdatePaymentStatusDto = {
          paymentId: msg.paymentId,
          paymentStatus,
        };
        this.connectorService.sendUpdateToPayment(paymentDto);
        break;

      case 'shipments-queue':
        const shipmentStatus = successfull
          ? ShipmentStatus.DELIVERED
          : ShipmentStatus.FAILED;
        const shipmentDto: UpdateShipmentStatusDto = {
          shipmentId: msg.shipmentId,
          shipmentStatus,
        };
        this.connectorService.sendUpdateToShipment(shipmentDto);
        break;
    }
  }

  /**
   * Resets all rate limits every minute
   */
  @Cron('0 * * * * *')
  resetMessageCounts() {
    this.logger.debug(`Resetting message counts.`);
    let reconnect: boolean = false;
    this.queues.forEach((queue) => {
      // check if processing was stopped for any queue
      if (!this.processingAllowed[queue]) {
        reconnect = true;
      }
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });

    if (reconnect) {
      this.reconnectToRabbitMQ();
    }
  }

  /**
   * Reconnects to RabbitMQ.
   * Closes the existing channel and connection, then reconnects and initializes consumers for all queues.
   * This leads to RabbitMQ resending all unacknowledged messages.
   */
  private async reconnectToRabbitMQ() {
    try {
      this.logger.debug('Reconnecting to RabbitMQ...');
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      // Reconnect to RabbitMW
      await this.connectToRabbitMQ();
      this.queues.forEach((queue) => this.initializeConsumer(queue));
    } catch (error) {
      this.logger.error('Failed to reconnect to RabbitMQ', error);
    }
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
