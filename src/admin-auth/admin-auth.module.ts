import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminAuthService } from './admin-auth.service';
import { AdminUser, AdminUserSchema } from './admin-user.schema';
import { AdminAuthController } from './admin-auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
      signOptions: { issuer: 'dentistry-admin' },
    }),
    MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }]),
  ],
  providers: [AdminAuthService],
  controllers: [AdminAuthController],
  exports: [AdminAuthService],
})
export class AdminAuthModule implements OnModuleInit {
  constructor(private readonly service: AdminAuthService) {}

  async onModuleInit() {
    await this.service.ensureBootstrapAdmin();
  }
}
