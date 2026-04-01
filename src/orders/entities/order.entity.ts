import { ApiProperty } from '@nestjs/swagger';
import { Item } from 'src/orders/entities/item.entity';
import { Customer } from './customer.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { JsonValue } from '@prisma/client/runtime/client';

export class Order {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotency_key: string;

  @ApiProperty()
  @IsNotEmpty()
  customer: JsonValue | Customer;

  @ApiProperty()
  @IsNotEmpty()
  items: Item[];

  @ApiProperty()
  @IsString()
  status: string;
}
