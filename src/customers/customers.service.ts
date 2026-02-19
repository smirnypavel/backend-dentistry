import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { Customer, CustomerDocument } from './customer.schema';

export interface UpsertCustomerInput {
  phone: string;
  name?: string;
  email?: string;
  marketingOptIn?: boolean;
  metadata?: Record<string, unknown>;
  markPhoneVerified?: boolean;
  touchLastLogin?: boolean;
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);
  private readonly defaultCountry?: CountryCode;

  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly configService: ConfigService,
  ) {
    const country = this.configService.get<string>('CUSTOMER_PHONE_DEFAULT_COUNTRY');
    this.defaultCountry = country ? (country.toUpperCase() as CountryCode) : undefined;
  }

  normalizePhone(rawPhone: string): string {
    const candidate = rawPhone?.trim();

    if (!candidate) {
      throw new BadRequestException('Phone number is required');
    }

    const digitsOnly = candidate.replace(/[\s()-]/g, '');
    const parsed = parsePhoneNumberFromString(digitsOnly, this.defaultCountry);

    if (!parsed?.isValid()) {
      throw new BadRequestException('Invalid phone number format');
    }

    return parsed.number;
  }

  async findById(id: string | Types.ObjectId): Promise<CustomerDocument | null> {
    return this.customerModel.findById(id).exec();
  }

  async findByPhone(phone: string): Promise<CustomerDocument | null> {
    const normalized = this.normalizePhone(phone);
    return this.customerModel.findOne({ phone: normalized }).exec();
  }

  async upsertCustomer(input: UpsertCustomerInput): Promise<CustomerDocument> {
    const normalizedPhone = this.normalizePhone(input.phone);

    const update: UpdateQuery<CustomerDocument> = {
      $set: {
        phone: normalizedPhone,
      },
      $setOnInsert: {},
    };

    if (input.name !== undefined) {
      (update.$set as Record<string, unknown>).name = input.name;
    }

    if (input.email !== undefined) {
      (update.$set as Record<string, unknown>).email = input.email;
    }

    if (input.marketingOptIn !== undefined) {
      (update.$set as Record<string, unknown>).marketingOptIn = input.marketingOptIn;
    }

    if (input.metadata !== undefined) {
      (update.$set as Record<string, unknown>).metadata = input.metadata;
    }

    if (input.markPhoneVerified ?? true) {
      (update.$set as Record<string, unknown>).isPhoneVerified = true;
    }

    if (input.touchLastLogin ?? true) {
      (update.$set as Record<string, unknown>).lastLoginAt = new Date();
    }

    const filter: FilterQuery<Customer> = { phone: normalizedPhone };

    try {
      return await this.customerModel
        .findOneAndUpdate(filter, update, {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        })
        .exec();
    } catch (error) {
      this.logger.error('Failed to upsert customer', (error as Error).stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<CustomerDocument | null> {
    const normalized = email?.trim()?.toLowerCase();
    if (!normalized) return null;
    return this.customerModel.findOne({ email: normalized }).exec();
  }

  async setPassword(customerId: string | Types.ObjectId, passwordHash: string): Promise<void> {
    await this.customerModel.updateOne({ _id: customerId }, { $set: { passwordHash } }).exec();
  }

  async touchLastLogin(customerId: string | Types.ObjectId): Promise<void> {
    await this.customerModel
      .updateOne({ _id: customerId }, { $set: { lastLoginAt: new Date() } })
      .exec();
  }

  async updateProfile(
    customerId: string | Types.ObjectId,
    updates: { name?: string; email?: string },
  ): Promise<CustomerDocument> {
    const set: Record<string, unknown> = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.email !== undefined) set.email = updates.email.trim().toLowerCase();

    if (Object.keys(set).length === 0) {
      const customer = await this.findById(customerId);
      if (!customer) throw new Error('Customer not found');
      return customer;
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(customerId, { $set: set }, { new: true })
      .exec();

    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async markPhoneUnverified(customerId: string | Types.ObjectId): Promise<void> {
    await this.customerModel
      .updateOne(
        { _id: customerId },
        {
          $set: { isPhoneVerified: false },
        },
      )
      .exec();
  }
}
