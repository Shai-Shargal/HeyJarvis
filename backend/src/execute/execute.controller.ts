import { Controller, Post, Body, UseGuards, HttpStatus, HttpException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ExecuteService } from './execute.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async execute(
    @User() userId: string,
    @Body() body: ExecuteRequestDto,
  ) {
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.plan) {
      throw new BadRequestException('Missing action plan');
    }

    // Check confirmation guardrail before execution
    const requiresConfirm = this.requiresConfirmation(body.plan);
    if (requiresConfirm && body.confirm !== true) {
      // Log the blocked execution attempt
      await this.executeService.logConfirmationRequired(
        userId,
        body.plan,
        body.message,
      );
      
      throw new BadRequestException({
        error: 'CONFIRMATION_REQUIRED',
        message: 'This action requires explicit confirmation. Please set confirm=true in your request.',
        plan: body.plan,
      });
    }

    try {
      const result = await this.executeService.executePlan(
        userId,
        body.plan,
        body.message,
        body.approved !== undefined ? body.approved : true,
      );
      return result;
    } catch (error) {
      console.error('Error executing plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        { error: 'Execution failed', message: errorMessage },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Determine if the action plan requires confirmation
   */
  private requiresConfirmation(plan: { intent: string; risk?: string; params?: { maxResults?: number } }): boolean {
    // Calculate execution cap
    const cap = Math.min(plan.params?.maxResults ?? 50, 50);
    
    // Require confirmation for DELETE_EMAILS with cap > 1
    if (plan.intent === 'DELETE_EMAILS' && cap > 1) {
      return true;
    }
    
    // Require confirmation for HIGH risk actions, but ONLY if cap > 1
    // Single email deletions (cap = 1) are safe even if risk is HIGH
    if (plan.risk === 'HIGH' && cap > 1) {
      return true;
    }
    
    return false;
  }
}

