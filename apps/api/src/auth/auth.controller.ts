import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, Length } from 'class-validator';
import { Trim } from '../common/trim.decorator';
import { CurrentUser, Public } from './auth.decorators';
import { getCookie } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedUser, RequestWithUser } from './auth.types';

class LoginDto {
  @Trim() @IsEmail() email!: string;
  @IsString() @Length(1, 200) password!: string;
}

const SESSION_COOKIE = 'sitra_session';

function sessionCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true' ? ' Secure;' : '';
  const sameSite = ['Strict', 'Lax', 'None'].includes(process.env.SESSION_COOKIE_SAME_SITE ?? '') ? process.env.SESSION_COOKIE_SAME_SITE : 'Lax';
  const domain = process.env.SESSION_COOKIE_DOMAIN ? ` Domain=${process.env.SESSION_COOKIE_DOMAIN};` : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=${sameSite};${domain} Max-Age=${maxAge};${secure}`;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: LoginDto, @Res() response: any) {
    const result = await this.auth.login(body.email, body.password);
    response.setHeader('Set-Cookie', sessionCookie(encodeURIComponent(result.token), 28800));
    return response.status(200).json({ user: result.user, expiresAt: result.expiresAt });
  }

  // Public so an expired session can still clear its cookie.
  @Public()
  @Post('logout')
  async logout(@Req() request: RequestWithUser, @Res() response: any) {
    const token = getCookie(request.headers.cookie, SESSION_COOKIE);
    if (token) await this.auth.revokeSession(token);
    response.setHeader('Set-Cookie', sessionCookie('', 0));
    return response.status(200).json({ success: true });
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
