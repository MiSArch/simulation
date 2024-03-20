import { Body, Controller, Post } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post('/register')
  async register(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentService.register(createShipmentDto);
  }

  @Post('/update')
  async update(@Body() updateShipmentDto: UpdateShipmentDto) {
    return this.shipmentService.update(updateShipmentDto);
  }
}
