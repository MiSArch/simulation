import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';

/**
 * The controller for the payment service.
 */
@Controller('ecs')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('defined-variables')
  async getDefinedVariables() {
    return this.configurationService.getDefinedVariables();
  }

  @Post('variables')
  async setVariables(@Body() variables: Record<string, any>) {
    return this.configurationService.setVariables(variables);
  }
}
