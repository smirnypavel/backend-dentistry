import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminUserDocument = HydratedDocument<AdminUser>;

@Schema({ timestamps: true, collection: 'admin_users' })
export class AdminUser {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
// Unique index on username is already created via @Prop({ unique: true }).
