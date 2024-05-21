import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';

/**
 * The controller for the payment service.
 */
@Controller('ecs')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  /**
   * Endpoint for service defined variables.
   * @returns The variable definitions as key value pairs.
  */
  @Get('defined-variables')
  async getDefinedVariables(): Promise<Record<string, any>>{
    return this.configurationService.getDefinedVariables();
  }

  /**
   * Endpoint to change service variables.
   * @param variables - The updated variables.
   * @returns A promise that resolves to void.
  */
  @Post('variables')
  async setVariables(@Body() variables: Record<string, any>): Promise<void> {
    return this.configurationService.setVariables(variables);
  }
}
