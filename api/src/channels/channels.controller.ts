import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/auth/current-user.decorator';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post(':workspaceId')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createChannelDto: CreateChannelDto,
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.create(workspaceId, createChannelDto, userId);
  }

  @Get(':workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.channelsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':workspaceId/channels/:channelId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.update(
      workspaceId,
      channelId,
      updateChannelDto,
      userId,
    );
  }

  @Delete(':workspaceId/channels/:channelId')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.remove(workspaceId, channelId, userId);
  }
}
