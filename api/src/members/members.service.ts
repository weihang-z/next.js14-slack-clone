import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(workspaceId: string, userId: string) {
    return this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });
  }


  async getAll(workspaceId: string, userId: string) {
    const members = await this.prisma.member.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });

    return members;
  }

  async getById(id: string, userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });
    if (!member) return null;

    const current = await this.prisma.member.findUnique({
      where: {
        workspaceId_userId: { workspaceId: member.workspaceId, userId },
      },
    });
    if (!current) return null;

    return member;
  }

  async updateRole(workspaceId: string, id: string, role: 'admin' | 'member', userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || currentMember.role !== 'admin') throw new ForbiddenException();

    await this.prisma.member.update({
      where: { id },
      data: { role },
    });

    return id;
  }

  async remove(workspaceId: string, id: string, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || currentMember.role !== 'admin') throw new ForbiddenException();

    const target = await this.prisma.member.findUnique({ where: { id } });
    if (!target || target.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reaction.deleteMany({ where: { memberId: id } });
      await tx.message.deleteMany({ where: { memberId: id } });
      await tx.conversation.deleteMany({
        where: { OR: [{ memberOneId: id }, { memberTwoId: id }] },
      });
      await tx.member.delete({ where: { id } });
    });

    return id;
  }
}
