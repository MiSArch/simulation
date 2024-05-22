import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as amqp from 'amqplib';
import { ConnectorService } from '../connector/connector.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';
import { ShipmentStatus } from 'src/shared/enums/shipment-status.enum';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status';
import { ShipmentService } from 'src/shipment/shipment.service';
import { PaymentService } from 'src/payment/payment.service';
import { ConfigurationService } from 'src/configuration/configuration.service';

/**
 * The service to process events from the respective queues.
 * @property processingTime The simulated processing time for each queue
 * @property connection The current RabbitMQ connection
 * @property queues An array containing all queue identifiers, to connect to
 * @property maxMessages The rate limit for each queue per minute
 * @property messageCounts The current message count
 * @property processingAllowed A flag to indicate if processing is allowed for the queue
 * @property rabbitmqUrl The RabbitMQ URL
 */
@Injectable()
export class EventProcessorService
  implements OnModuleInit, OnApplicationShutdown
{
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private queues = ['payments-queue', 'shipments-queue'];
  private messageCounts: { [key: string]: number } = {};
  private processingAllowed: { [key: string]: boolean } = {};
  private rabbitmqUrl: string;

  constructor(
    private readonly logger: Logger,
    private configService: ConfigurationService,
    private connectorService: ConnectorService,
    private shipmentService: ShipmentService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Initializes the module.
   * Connects to RabbitMQ and initializes consumers for all queues.
   */
  async onModuleInit() {
    this.rabbitmqUrl = this.configService.getCurrentVariableValue<string>(
      'RABBITMQ_URL',
      'NOT_SET',
    );
    if (this.rabbitmqUrl === 'NOT_SET') {
      throw new Error('RABBITMQ_URL is not set');
    }
    let rabbitMQConnected: boolean = await this.connectToRabbitMQ();

    while (!rabbitMQConnected) {
      this.logger.debug('Retrying in 5 seconds.');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      rabbitMQConnected = await this.connectToRabbitMQ();
    }
    // setup queues
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
      this.initializeConsumer(queue);
    });
  }

  /**
   * Helper function, that retrieves the current simulated processing time for a given queue.
   * @param queueName - The name of the queue.
   * @returns The processing time in seconds.
   */
  private getProcessingTime(queueName: string) {
    const key = queueName == 'payments-queue' ? 'PAYMENT' : 'SHIPMENT';
    return this.configService.getCurrentVariableValue<number>(
      `${key}_PROCESSING_TIME`,
      5,
    );
  }

  /**
   * Helper function, that retrieves the current upper processing limit for a given queue.
   * @param queueName - The name of the queue.
   * @returns The rate limit per minute.
   */
  private getMaxPerMinute(queueName: string) {
    const key = queueName == 'payments-queue' ? 'PAYMENTS' : 'SHIPMENTS';
    return this.configService.getCurrentVariableValue<number>(
      `${key}_PER_MINUTE`,
      1000000,
    );
  }

  /**
   * Helper function, that retrieves the current success rate for a given queue.
   * @param queueName - The name of the queue.
   * @returns The success rate im percent as a double.
   */
  private getSuccessRate(queueName: string) {
    const key = queueName == 'payments-queue' ? 'PAYMENT' : 'SHIPMENT';
    return this.configService.getCurrentVariableValue<number>(
      `${key}_SUCCESS_RATE`,
      0.95,
    );
  }

  /**
   * connects to the RabbitMQ Queue
   * @returns boolean that indicates if the connection was successful
   */
  private async connectToRabbitMQ(): Promise<boolean> {
    try {
      // Establish a connection to the RabbitMQ server
      this.connection = await amqp.connect(this.rabbitmqUrl);
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
      (msg: amqp.ConsumeMessage | null) => this.consumeMessage(queue, msg),
      {
        noAck: false,
      },
    );
  }

  /**
   * Consumes a message from the queue
   * Dynamically loads configuration for each queue
   * @param queue the queue identifier
   * @param messageObject the message object to consume
   */
  private consumeMessage(queue: string, message: amqp.Message | null) {
    const maxMessages = this.getMaxPerMinute(queue);
    const delay = this.getProcessingTime(queue);
    if (this.messageCounts[queue] >= maxMessages) {
      this.logger.debug(`[${queue}] Maximum message count reached. Pausing processing until reset.`);
      return (this.processingAllowed[queue] = false);
    }
    if (!message) { return }
    const { data } = this.parseMessage(message);
    this.logger.debug(`[${queue}] Processing message: ${JSON.stringify(data)} [${this.messageCounts[queue] + 1}/${maxMessages}]`);
    this.channel.ack(message);

    // check if message was already manually updated
    if (this.isBlocked(queue, data)) { return }

    this.messageCounts[queue]++;
    // simulate processing
    this.logger.log(`[${queue}] Sending Event Update after [${delay}]s`);
    setTimeout(() => {
      const id = data.paymentId || data.shipmentId;
      if (!id) { throw new Error('No ID found in message') }
      this.buildEventUpdate(queue, id);
    }, delay * 1000);
  }

  private parseMessage(msg: amqp.Message): {
    messagePattern: string;
    data: { paymentId?: string; shipmentId?: string };
  } {
    const message = msg.content.toString();
    return JSON.parse(message);
  }

  /**
   * Checks if a message was already manually updated
   * @param queue the queue identifier
   * @param message the message to check
   * @returns boolean indicating if the message was manually updated
   * @throws Error if the queue is unknown
   */
  private isBlocked(queue: string, data: any): boolean {
    switch (queue) {
      case 'payments-queue': {
        return this.paymentService.isBlocked(data.paymentId);
      }
      case 'shipments-queue': {
        return this.shipmentService.isBlocked(data.shipmentId);
      }
      default:
        throw new Error('Unknown queue');
    }
  }

  /**
   * Builds the DTOs for the updated event for each queue
   * @param queueName The string identifier of the queue
   * @param msg The received message
   */
  private buildEventUpdate(queueName: string, id: string) {
    // flip successfull event with dynamic success rate
    const successRate = this.getSuccessRate(queueName);
    const successfull: boolean = Math.random() < successRate;
    switch (queueName) {
      case 'payments-queue': {
        const status = successfull
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.FAILED;
        const paymentDto: UpdatePaymentStatusDto = {
          paymentId: id,
          status,
        };
        this.connectorService.sendUpdateToPayment(paymentDto);
        break;
      }
      case 'shipments-queue': {
        const status = successfull
          ? ShipmentStatus.DELIVERED
          : ShipmentStatus.FAILED;
        const shipmentDto: UpdateShipmentStatusDto = {
          shipmentId: id,
          status,
        };
        this.connectorService.sendUpdateToShipment(shipmentDto);
        break;
      }
    }
  }

  /**
   * Resets all rate limits every minute
   * Reconnects only if processing was stopped for any queue and the current rate is greater than 0
   */
  @Cron('0 * * * * *')
  resetMessageCounts() {
    this.logger.debug(`Resetting message counts.`);
    let reconnect: boolean = false;
    this.queues.forEach((queue) => {
      // check if processing was stopped for any queue
      const maxMessages = this.getMaxPerMinute(queue);
      if (!this.processingAllowed[queue] && maxMessages > 0) {
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
      }
      if (this.connection) {
        await this.connection.close();
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
