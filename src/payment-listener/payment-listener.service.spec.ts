import { Test, TestingModule } from '@nestjs/testing';
import { PaymentListenerService } from './payment-listener.service';

describe('PaymentListenerService', () => {
  let service: PaymentListenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentListenerService],
    }).compile();

    service = module.get<PaymentListenerService>(PaymentListenerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
