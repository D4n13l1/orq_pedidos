import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let findAllMock: jest.Mock;

  beforeEach(async () => {
    findAllMock = jest.fn().mockResolvedValue(['order1', 'order2']);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findAll: findAllMock,
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all orders', async () => {
    const result = await controller.findAll();
    expect(result).toEqual(['order1', 'order2']);
    expect(findAllMock).toHaveBeenCalled();
  });
});
