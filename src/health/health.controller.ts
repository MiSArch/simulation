import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /**
   * Returns the health status of the application.
   * @returns a JSON including the health status of the application.
   */
  @Get()
  getHealth(): { status: string } {
    return { status: 'OK' };
  }
}
