import { CustomerDocument } from '../customer.schema';

export interface CustomerDto {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  isPhoneVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
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
