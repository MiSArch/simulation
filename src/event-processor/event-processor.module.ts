import { Logger, Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { ConnectorService } from './connector.service';
import { HttpModule } from '@nestjs/axios';

/**
 * The module for the event processor service.
 */
@Module({
  imports: [HttpModule],
  providers: [EventProcessorService, Logger, ConnectorService],
})
export class EventProcessorModule {}
