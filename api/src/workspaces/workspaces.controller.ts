import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { IsString } from 'class-validator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private service: WorkspacesService) {}

  @Get()
  async list(@CurrentUserId() userId: string) {
    return this.service.listForUser(userId);
  }

  @Post()
  async create(@Body() body: CreateWorkspaceDto, @CurrentUserId() userId: string) {
    const id = await this.service.create(body.name, userId);
    return { id };
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUserId() userId: string) {
    const ws = await this.service.getById(id, userId);
    if (!ws) {
      return { id: null, name: null, joinCode: null, createdAt: null, updatedAt: null } as any;
    }
    return ws;
  }

  @Get(':id/info')
  async getInfo(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.service.getInfo(id, userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateWorkspaceDto, @CurrentUserId() userId: string) {
    const updatedId = await this.service.update(id, body.name, userId);
    return { id: updatedId };
  }

  @Post(':id/join-code')
  async newJoinCode(@Param('id') id: string, @CurrentUserId() userId: string) {
    const updatedId = await this.service.newJoinCode(id, userId);
    return { id: updatedId };
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @Body() body: JoinWorkspaceDto, @CurrentUserId  () userId: string) {
    const joinedId = await this.service.join(id, body.joinCode, userId);
    return { id: joinedId };
  }
}


