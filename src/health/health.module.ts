import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Module for health checks.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
