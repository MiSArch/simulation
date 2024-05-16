import { Logger, Module } from '@nestjs/common';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';

@Module({
  controllers: [ConfigurationController],
  providers: [ConfigurationService, Logger],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
