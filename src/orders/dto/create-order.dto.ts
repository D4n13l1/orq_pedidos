import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../entities/customer.entity';
import { Item } from '../entities/item.entity';

export class CreateOrderDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  customer: Customer;

  @ApiProperty({ type: [Item] })
  items: Item[];

  @ApiProperty()
  currency: string;
}
