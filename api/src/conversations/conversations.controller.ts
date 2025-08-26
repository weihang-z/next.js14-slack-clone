import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { IsString } from 'class-validator';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createOrGet(
    @Body() body: { workspaceId: string; memberId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.service.createOrGet(body.workspaceId, body.memberId, userId);
  }
}
