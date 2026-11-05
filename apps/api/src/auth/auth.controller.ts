import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, Length } from 'class-validator';
import { CurrentUser, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { AuthenticatedUser, RequestWithUser } from './auth.types';
class LoginDto {
  @IsEmail() email!: string;
  @IsString() @Length(1, 200) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: LoginDto, @Res() response: any) {
    const result = await this.auth.login(body.email, body.password);
    const secure = process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true' ? ' Secure;' : '';
    const sameSite = process.env.SESSION_COOKIE_SAME_SITE || 'Lax';
    const domain = process.env.SESSION_COOKIE_DOMAIN ? ` Domain=${process.env.SESSION_COOKIE_DOMAIN};` : '';
    response.setHeader('Set-Cookie', `sitra_session=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=${sameSite};${domain} Max-Age=28800;${secure}`);
    return response.status(200).json({ user: result.user, expiresAt: result.expiresAt });
  }
  @Post('logout')
  async logout(@Req() request: RequestWithUser, @Res() response: any, @CurrentUser() user: AuthenticatedUser) {
    const token = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('sitra_session='))?.slice('sitra_session='.length);
    if (token) await this.auth.revokeSession(decodeURIComponent(token));
    const secure = process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true' ? ' Secure;' : '';
    const sameSite = process.env.SESSION_COOKIE_SAME_SITE || 'Lax';
    const domain = process.env.SESSION_COOKIE_DOMAIN ? ` Domain=${process.env.SESSION_COOKIE_DOMAIN};` : '';
    response.setHeader('Set-Cookie', `sitra_session=; Path=/; HttpOnly; SameSite=${sameSite};${domain} Max-Age=0;${secure}`);
    return response.status(200).json({ success: true, userId: user.id });
  }
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
