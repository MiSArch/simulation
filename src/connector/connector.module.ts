import { Logger, Module } from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { HttpModule } from '@nestjs/axios';

/**
 * The module for the connector service.
 */
@Module({
  imports: [HttpModule],
  providers: [ConnectorService, Logger],
  exports: [ConnectorService],
})
export class ConnectorModule {}
