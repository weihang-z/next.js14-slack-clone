import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createOrGet(workspaceId: string, memberId: string, userId: string) {
    const current = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    const other = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    // check if current member is in the workspace
    if (!current || !other) throw new NotFoundException('Member not found');
    const existing = await this.prisma.conversation.findFirst({
      where: {
        workspaceId,
        OR: [
          { memberOneId: current.id, memberTwoId: other.id },
          { memberOneId: other.id, memberTwoId: current.id },
        ],
      },
    });
    if (existing) return existing;
    const created = await this.prisma.conversation.create({
      data: { workspaceId, memberOneId: current.id, memberTwoId: other.id },
    });
    return created;
  }
}
