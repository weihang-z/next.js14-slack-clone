import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ReactionsService } from './reactions.service';
import { IsString } from 'class-validator';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('reactions')
export class ReactionsController {
  constructor(private service: ReactionsService) {}

  @Post('toggle')
  async toggle(@Body() body: ToggleReactionDto, @CurrentUserId() userId: string) {
    return { id: await this.service.toggle(body.messageId, body.value, userId) };
  }
}