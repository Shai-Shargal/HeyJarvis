import { Controller, Post, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('execute')
export class ExecuteController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async execute(@User() userId: string) {
    // Stub implementation - returns 501 Not Implemented
    throw new HttpException(
      {
        error: 'Not Implemented',
        message: 'Execution functionality will be implemented in Day 7',
      },
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}

