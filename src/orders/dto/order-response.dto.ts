import { Items } from 'generated/prisma/client';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';

export class OrderResponseDto {
  order_id: string;
  currency: string;
  customer: Customer;
  items: Items[];
  status: string;

  constructor(order: Order) {
    this.order_id = order.order_id;
    this.currency = order.currency;
    this.customer = order.customer as Customer;
    this.items = order.items as Items[];
    this.status = order.status;
  }
}
