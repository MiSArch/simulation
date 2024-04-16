import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { UpdateShipmentStatusDto } from '../event-processor/dto/update-shipment-status';
import { UpdatePaymentStatusDto } from '../event-processor/dto/update-payment-status.dto';

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
    private readonly configService: ConfigService,
  ) {
    this.paymentEndpoint = this.configService.get<string>('PAYMENT_URL');
    this.shipmentEndpoint = this.configService.get<string>('SHIPMENT_URL');
  }

  /**
   * Sends an update to the shipment service.
   * @param data - The data to be sent for updating the shipment status.
   * @returns A promise that resolves to an AxiosResponse object.
   */
  async sendUpdateToShipment(
    data: UpdateShipmentStatusDto,
  ): Promise<AxiosResponse> {
    if (!this.shipmentEndpoint) {
      this.logger.error('Shipment URL not set');
      return null;
    }
    return this.send(`${this.shipmentEndpoint}/shipment/update`, data);
  }

  /**
   * Sends an update to the payment service.
   * @param data - The data to be sent for updating the payment status.
   * @returns A promise that resolves to an AxiosResponse object.
   */
  async sendUpdateToPayment(
    data: UpdatePaymentStatusDto,
  ): Promise<AxiosResponse> {
    if (!this.paymentEndpoint) {
      this.logger.error('Payment URL not set');
      return null;
    }
    return this.send(`${this.paymentEndpoint}/payment/update`, data);
  }

  /**
   * Sends a request to the specified endpoint with the provided data.
   * @param endpoint The endpoint to send the request to.
   * @param data The data to send with the request.
   * @returns An Observable that emits the AxiosResponse object.
   * @throws An error if the request fails.
   */
  async send(endpoint: string, data: any): Promise<AxiosResponse> {
    try {
      const response = await this.httpService.post(endpoint, data).toPromise();
      if (response.status !== 200) {
        this.logger.error(
          `Request to ${endpoint} failed with status ${response.status}`,
        );
      }
      return response;
    } catch (error) {
      this.logger.error(`Error sending request to ${endpoint}:`, error);
    }
  }
}
