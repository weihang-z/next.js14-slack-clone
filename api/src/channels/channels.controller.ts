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

  @Post('create')
  create(
    @Body() data: CreateChannelDto & { workspaceId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.create(data.workspaceId, data, userId);
  }

  @Post('list')
  findAll(@Body() data: { workspaceId: string }) {
    return this.channelsService.findAll(data.workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') channelId: string,
    @Body() updateData: UpdateChannelDto & { workspaceId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.update(
      updateData.workspaceId,
      channelId,
      updateData,
      userId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') channelId: string,
    @Body() data: { workspaceId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.channelsService.remove(data.workspaceId, channelId, userId);
  }
}
