import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { User } from './auth/user.decorator';
import { UserService } from './auth/user.service';

@Controller()
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() userId: string) {
    return this.userService.getUserInfo(userId);
  }
}

