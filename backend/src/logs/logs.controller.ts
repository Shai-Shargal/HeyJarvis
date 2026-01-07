import { Controller, Get, Param, Query, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * GET /logs?limit=20
   * Get list of action logs for the authenticated user
   */
  @Get()
  async getLogs(
    @User() userId: string,
    @Query('limit') limit?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Parse limit, default to 20
    let limitNum = 20;
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new BadRequestException('Limit must be a positive number');
      }
      limitNum = parsed;
    }

    const logs = await this.logsService.getLogs(userId, limitNum);
    return logs;
  }

  /**
   * GET /logs/:id
   * Get detailed information about a specific log
   */
  @Get(':id')
  async getLogById(@User() userId: string, @Param('id') id: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const log = await this.logsService.getLogById(userId, id);
    return log;
  }
}


