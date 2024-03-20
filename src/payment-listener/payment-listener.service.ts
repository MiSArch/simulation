import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as amqp from 'amqplib';
// import { ConnectionService } from './connection.service'; // Adjust import path as needed

@Injectable()
export class MessageListenerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger: Logger;
  private readonly processingTime: number;
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private queues = ['payments-queue', 'shipments-queue'];
  private maxMessages;
  private messageCounts: { [key: string]: number } = {};
  private processingAllowed: { [key: string]: boolean } = {};

  constructor(
    private configService: ConfigService,
    // private connectionService: ConnectionService, // Assume this service is correctly injected
  ) {
    this.logger = new Logger(MessageListenerService.name);
    this.processingTime = this.configService.get<number>(
      'PROCESSING_TIME_SECONDS',
      5000,
    );
    this.maxMessages = this.configService.get<number>(
      'PAYMENTS_PER_MINUTE',
      100,
    );
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });
  }

  async onModuleInit() {
    await this.connectToRabbitMQ();
    this.queues.forEach((queue) => this.initializeConsumer(queue));
  }

  private async connectToRabbitMQ() {
    const rabbitmqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost',
    );
    try {
      // Establish a connection to the RabbitMQ server
      this.connection = await amqp.connect(rabbitmqUrl);
      // Create a channel, which is where most of the API for getting things done resides
      this.channel = await this.connection.createChannel();

      // Assert queues to ensure they exist. If they do not, they are created.
      this.queues.forEach(async (queue) => {
        await this.channel.assertQueue(queue, {
          durable: true, // Make sure the queue is persisted even if RabbitMQ restarts
        });
      });

      this.logger.log('Connected to RabbitMQ and ensured queues exist.');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error; // Rethrow or handle error appropriately
    }
  }

  private initializeConsumer(queue: string) {
    this.channel.consume(
      queue,
      (msg) => {
        if (msg && this.processingAllowed[queue]) {
          this.logger.debug(
            `[${queue}] Processing message: ${msg.content.toString()} [${this.messageCounts[queue] + 1}/${this.maxMessages}]`,
          );
          this.channel.ack(msg);
          this.messageCounts[queue]++;
          const delay = Math.floor(Math.random() * this.processingTime);
          setTimeout(() => {
            this.logger.log(`[${queue}] Sending Event to payment [${delay}]`);
            // Implement actual message processing logic here
          }, delay);

          if (this.messageCounts[queue] >= this.maxMessages) {
            this.logger.debug(
              `[${queue}] Maximum message count reached. Pausing processing until reset.`,
            );
            this.processingAllowed[queue] = false;
          }
        }
      },
      { noAck: false }, // Acknowledge messages manually after processing
    );
  }

  @Cron('0 * * * * *')
  resetMessageCounts() {
    this.logger.debug(`Resetting message counts.`);
    this.queues.forEach((queue) => {
      this.messageCounts[queue] = 0;
      this.processingAllowed[queue] = true;
    });
  }

  async onApplicationShutdown() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
