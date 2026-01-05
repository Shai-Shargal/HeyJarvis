import { Controller, Post, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ExecuteService } from './execute.service';
import { ActionPlan } from '../chat/chat.types';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async execute(
    @User() userId: string,
    @Body() body: { plan: ActionPlan },
  ) {
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.plan) {
      throw new HttpException(
        { error: 'Missing action plan' },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const result = await this.executeService.executePlan(userId, body.plan);
      return result;
    } catch (error) {
      console.error('Error executing plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { error: 'Execution failed', message: errorMessage },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

