import { Logger, Module } from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigurationModule } from 'src/configuration/configuration.module';

/**
 * The module for the connector service.
 */
@Module({
  imports: [
    HttpModule, 
    ConfigurationModule
  ],
  providers: [ConnectorService, Logger],
  exports: [ConnectorService],
})
export class ConnectorModule {}
