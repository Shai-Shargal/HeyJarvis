import { Controller, Post, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async generateActionPlan(
    @User() userId: string,
    @Body() chatRequest: ChatRequestDto,
  ) {
    try {
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const plan = await this.chatService.generateActionPlan(chatRequest.message);
      return { plan };
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

