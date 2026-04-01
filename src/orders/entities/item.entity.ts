import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Item {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sku: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  qty: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  unit_price: number;
}
