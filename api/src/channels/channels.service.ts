import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async create(
    workspaceId: string,
    createChannelDto: CreateChannelDto,
    userId: string,
  ) {
    const member = await this.prisma.member.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
    if (!member) throw new UnauthorizedException('Unauthorized');

    const parsedName = createChannelDto.name.replace(/\s+/g, '-').toLowerCase();
    const channel = await this.prisma.channel.create({
      data: { name: parsedName, workspaceId },
    });
    return channel.id;
  }

  findAll(workspaceId: string) {
    return this.prisma.channel.findAll({ where: { workspaceId } });
  }

  findOne(id: string) {
    return this.prisma.channel.findUnique({ where: { id } });
  }

  async update(
    workspaceId: string,
    channelId: string,
    updateChannelDto: UpdateChannelDto,
    userId: string,
  ) {
    const member = await this.prisma.member.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
    if (!member) throw new UnauthorizedException('Unauthorized');

    await this.prisma.channel.update({
      where: { id: channelId },
      data: { name: updateChannelDto.name },
    });
    return channelId;
  }

  async remove(workspaceId: string, channelId: string, userId: string) {
    const cuurentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!cuurentMember || cuurentMember.role !== 'admin')
      throw new ForbiddenException();

    await this.prisma.message.deleteMany({ where: { channelId } });
    await this.prisma.channel.delete({ where: { channelId } });
    return channelId;
  }
}
