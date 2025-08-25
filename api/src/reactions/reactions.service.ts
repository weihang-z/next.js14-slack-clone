import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  private async getMember(workspaceId: string, userId: string) {
    return this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
  }

  async toggle(messageId: string, value: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    const member = await this.getMember(message.workspaceId, userId);
    if (!member) throw new ForbiddenException();

    const existing = await this.prisma.reaction.findUnique({
      where: {
        messageId_memberId_value: {
          messageId,
          memberId: member.id,
          value,
        },
      },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return existing.id;
    } else {
      const created = await this.prisma.reaction.create({
        data: {
          messageId,
          memberId: member.id,
          value,
          workspaceId: message.workspaceId,
        },
      });
      return created.id;
    }
  }
}
