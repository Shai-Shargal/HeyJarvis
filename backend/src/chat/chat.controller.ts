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

      const plan = await this.chatService.generateActionPlan(chatRequest.message, userId);
      return { plan };
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) {
        throw new HttpException(
          {
            error: 'OpenAI API Configuration Error',
            message: errorMessage,
            hint: 'Please check your OPENAI_API_KEY in the .env file',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('credits')) {
        throw new HttpException(
          {
            error: 'OpenAI API Quota Exceeded',
            message: errorMessage,
            hint: 'Please add credits to your OpenAI account at https://platform.openai.com/account/billing',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        {
          error: 'Failed to generate action plan',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

