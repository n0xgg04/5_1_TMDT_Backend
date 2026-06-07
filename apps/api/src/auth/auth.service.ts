import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { Resend } from "resend";
import { PrismaService } from "../common/prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = this.config.get<string>(
      "EMAIL_FROM",
      "Sapphire Stay <onboarding@resend.dev>",
    );
    this.appUrl = this.config.get<string>("APP_URL", "http://localhost:3001");
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Email đã được sử dụng");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Gửi email chào mừng (fire-and-forget)
    this.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive || !user.refreshToken) {
        throw new UnauthorizedException("Refresh token không hợp lệ");
      }

      const tokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!tokenValid)
        throw new UnauthorizedException("Refresh token không hợp lệ");

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.saveRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException(
        "Refresh token không hợp lệ hoặc đã hết hạn",
      );
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: "Đăng xuất thành công" };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException("Ngườ i dùng không tồn tại");
    return user;
  }

  async updateProfile(
    userId: string,
    dto: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
    return user;
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException("Ngườ i dùng không tồn tại");

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Mật khẩu hiện tại không đúng");

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { message: "Đổi mật khẩu thành công" };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private sendWelcomeEmail(email: string, name: string) {
    if (!this.resend) return;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px;">
    <div style="background:#0f172a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Sapphire Stay</h1>
      <p style="color:#94a3b8;margin:6px 0 0;">Chào mừng bạn đến với trải nghiệm đặt phòng đẳng cấp</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
      <p>Kính chào <strong>${name}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Sapphire Stay</strong> — nền tảng đặt phòng khách sạn trực tuyến hàng đầu Việt Nam.</p>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Tài khoản của bạn đã sẵn sàng:</p>
        <ul style="margin:0;padding-left:20px;color:#475569;">
          <li>Tìm kiếm và đặt phòng nhanh chóng</li>
          <li>Thanh toán an toàn qua chuyển khoản ngân hàng</li>
          <li>Quản lý đơn đặt phòng mọi lúc, mọi nơi</li>
          <li>Nhận ưu đãi đặc biệt dành riêng cho thành viên</li>
        </ul>
      </div>
      <div style="text-align:center;margin-top:20px;">
        <a href="${this.appUrl}/rooms" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">
          Khám phá phòng ngay
        </a>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
        © 2026 Sapphire Stay. Vui lòng không trả lời email tự động này.
      </p>
    </div>
  </div>
</body>
</html>`;

    this.resend.emails
      .send({
        from: this.fromAddress,
        to: email,
        subject: `[Sapphire Stay] Chào mừng ${name} — Tài khoản đã được tạo thành công!`,
        html,
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      })
      .then(() => this.logger.log(`Welcome email sent to ${email}`))
      .catch((err) =>
        this.logger.error(`Welcome email failed for ${email}: ${err.message}`),
      );
  }
}
