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
    
    // Debug logging
    console.log('🔍 Execute Request Debug:', {
      intent: body.plan.intent,
      risk: body.plan.risk,
      maxResults: body.plan.params?.maxResults,
      confirm: body.confirm,
      requiresConfirm,
    });
    
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
        debug: {
          maxResults: body.plan.params?.maxResults,
          calculatedCap: Math.min(body.plan.params?.maxResults ?? 50, 50),
          requiresConfirm,
        },
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
    // Ensure params exists
    if (!plan.params) {
      plan.params = {};
    }
    
    // Calculate execution cap
    // If maxResults is not set, default to 50 (but we'll require confirmation for multi-email)
    const maxResults = plan.params.maxResults;
    const cap = maxResults !== undefined 
      ? Math.min(Math.max(1, maxResults), 50) // Clamp between 1 and 50
      : 50; // Default to 50 if not specified
    
    console.log('🔍 Confirmation Check:', {
      intent: plan.intent,
      risk: plan.risk,
      maxResults,
      cap,
    });
    
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

