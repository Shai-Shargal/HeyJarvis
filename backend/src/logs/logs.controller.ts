import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('logs')
export class LogsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getLogs(@User() userId: string) {
    // Stub implementation - returns empty list
    return [];
  }
}

