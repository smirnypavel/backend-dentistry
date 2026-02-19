import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDocument } from '../customer.schema';

export class CustomerDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c001' })
  id!: string;

  @ApiProperty({ example: '+380971112233' })
  phone!: string;

  @ApiPropertyOptional({ example: 'ivan@example.com', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ example: 'Іван', nullable: true })
  name!: string | null;

  @ApiProperty({ example: false })
  isPhoneVerified!: boolean;

  @ApiPropertyOptional({ example: '2026-02-19T12:00:00.000Z', nullable: true })
  createdAt!: string | null;

  @ApiPropertyOptional({ example: '2026-02-19T12:00:00.000Z', nullable: true })
  updatedAt!: string | null;

  @ApiPropertyOptional({ example: '2026-02-19T12:05:00.000Z', nullable: true })
  lastLoginAt!: string | null;
}

const toIsoString = (value?: Date | null): string | null => (value ? value.toISOString() : null);

export const toCustomerDto = (customer: CustomerDocument): CustomerDto => ({
  id: customer._id.toString(),
  phone: customer.phone,
  email: customer.email ?? null,
  name: customer.name ?? null,
  isPhoneVerified: customer.isPhoneVerified,
  createdAt: toIsoString(customer.createdAt),
  updatedAt: toIsoString(customer.updatedAt),
  lastLoginAt: toIsoString(customer.lastLoginAt),
});
