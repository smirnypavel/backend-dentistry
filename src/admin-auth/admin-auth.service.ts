import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { AdminUser, AdminUserDocument } from './admin-user.schema';
import bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: string; // user id
  username: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name) private readonly users: Model<AdminUserDocument>,
    private readonly jwt: JwtService,
  ) {}

  async ensureBootstrapAdmin(): Promise<void> {
    const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    if (!username || !password) return;
    const existing = await this.users.findOne({ username: username.toLowerCase() }).lean();
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.create({ username: username.toLowerCase(), passwordHash, name: 'Admin' });
  }

  async createAdmin(dto: {
    username: string;
    password: string;
    name?: string;
  }): Promise<AdminUser> {
    const username = dto.username.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.users.create({ username, passwordHash, name: dto.name });
  }

  async listAdmins(): Promise<Array<Pick<AdminUser, 'username' | 'name' | 'isActive'>>> {
    const items = await this.users.find().sort({ username: 1 }).lean();
    return items.map((u) => ({ username: u.username, name: u.name, isActive: u.isActive }));
  }

  async validateLogin(username: string, password: string): Promise<AdminUserDocument> {
    const user = await this.users.findOne({ username: username.toLowerCase(), isActive: true });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.validateLogin(username, password);
    const payload: JwtPayload = { sub: user._id.toString(), username: user.username };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '12h',
    });
    return { accessToken };
  }

  async verifyBearerToken(authHeader?: string): Promise<boolean> {
    if (!authHeader) return false;
    const [type, token] = authHeader.split(' ');
    if (!token || type.toLowerCase() !== 'bearer') return false;
    try {
      const decoded = await this.jwt.verifyAsync<JwtPayload>(token);
      if (!decoded?.sub) return false;
      const user = await this.users.findById(decoded.sub).lean();
      return Boolean(user && user.isActive);
    } catch {
      return false;
    }
  }
}
