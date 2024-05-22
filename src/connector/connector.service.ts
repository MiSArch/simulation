import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { UpdateShipmentStatusDto } from '../event-processor/dto/update-shipment-status';
import { UpdatePaymentStatusDto } from '../event-processor/dto/update-payment-status.dto';
import { ConfigurationService } from 'src/configuration/configuration.service';

/**
 * Service for connecting to the payment and simulation endpoints.
 * @property paymentEndpoint The URL for the payment service.
 * @property shipmentEndpoint The URL for the shipment service.
 */
@Injectable()
export class ConnectorService {
  private paymentEndpoint: string;
  private shipmentEndpoint: string;

  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
    private readonly configService: ConfigurationService,
  ) {
    this.paymentEndpoint = this.configService.getCurrentVariableValue(
      'PAYMENT_URL',
      'NOT_SET',
    );
    this.shipmentEndpoint = this.configService.getCurrentVariableValue(
      'SHIPMENT_URL',
      'NOT_SET',
    );
    if (this.paymentEndpoint === 'NOT_SET') {
      this.logger.error('Payment URL not set');
    }
    if (this.shipmentEndpoint === 'NOT_SET') {
      this.logger.error('Shipment URL not set');
    }
  }

  /**
   * Sends an update to the shipment service.
   * @param data - The data to be sent for updating the shipment status.
   * @returns A promise that resolves to an AxiosResponse object.
   */
  async sendUpdateToShipment(
    data: UpdateShipmentStatusDto,
  ): Promise<AxiosResponse | undefined> {
    return this.send(
      `${this.shipmentEndpoint}/shipment/${data.shipmentId}/status`,
      { status: data.status },
    );
  }

  /**
   * Sends an update to the payment service.
   * @param data - The data to be sent for updating the payment status.
   * @returns A promise that resolves to an AxiosResponse object.
   */
  async sendUpdateToPayment(
    data: UpdatePaymentStatusDto,
  ): Promise<AxiosResponse | undefined> {
    return this.send(
      `${this.paymentEndpoint}/payment/update-payment-status`,
      data,
    );
  }

  /**
   * Sends a request to the specified endpoint with the provided data.
   * @param endpoint The endpoint to send the request to.
   * @param data The data to send with the request.
   * @returns An Observable that emits the AxiosResponse object.
   * @throws An error if the request fails.
   */
  async send(endpoint: string, data: any): Promise<AxiosResponse | undefined> {
    try {
      const response = await this.httpService.post(endpoint, data).toPromise();
      if (!response) {
        throw new Error(`Request to ${endpoint} failed`);
      }
      if (response.status < 200 || response.status > 299) {
        this.logger.error(
          `Request to ${endpoint} failed with status ${response.status}`,
        );
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Error sending request to ${endpoint}: ${JSON.stringify(error)}`,
      );
    }
  }
}
