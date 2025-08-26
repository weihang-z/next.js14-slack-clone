import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  private generateJoinCode() {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code.toUpperCase();
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.member.findMany({ where: { userId } });
    const workspaceIds = memberships.map((m) => m.workspaceId);
    return this.prisma.workspace.findMany({ where: { id: { in: workspaceIds } } });
  }

  async getInfo(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return { name: null, isMember: false };
    const member = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    return { name: workspace.name, isMember: !!member };
  }

  async getById(workspaceId: string, userId: string) {
    const member = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    if (!member) return null;
    return this.prisma.workspace.findUnique({ where: { id: workspaceId } });
  }

  async create(name: string, userId: string) {
    const joinCode = this.generateJoinCode();
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        ownerId: userId,
        joinCode,
      },
    });
    await this.prisma.member.create({ data: { workspaceId: workspace.id, userId, role: 'admin' } });
    await this.prisma.channel.create({ data: { name: 'general', workspaceId: workspace.id } });
    return workspace.id;
  }

  async update(workspaceId: string, name: string, userId: string) {
    const member = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    if (!member || member.role !== 'admin') throw new ForbiddenException();
    await this.prisma.workspace.update({ where: { id: workspaceId }, data: { name } });
    return workspaceId;
  }

  async remove(workspaceId: string, userId: string) {
    const member = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    if (!member || member.role !== 'admin') throw new ForbiddenException();

    await this.prisma.reaction.deleteMany({ where: { workspaceId } });
    await this.prisma.message.deleteMany({ where: { workspaceId } });
    await this.prisma.conversation.deleteMany({ where: { workspaceId } });
    await this.prisma.channel.deleteMany({ where: { workspaceId } });
    await this.prisma.member.deleteMany({ where: { workspaceId } });
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
    return workspaceId;
  }

  async newJoinCode(workspaceId: string, userId: string) {
    const member = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    if (!member || member.role !== 'admin') throw new ForbiddenException();
    const joinCode = this.generateJoinCode();
    await this.prisma.workspace.update({ where: { id: workspaceId }, data: { joinCode } });
    return workspaceId;
  }

  async join(workspaceId: string, joinCode: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.joinCode !== joinCode.toUpperCase()) throw new ForbiddenException('Invalid join code');
    const existing = await this.prisma.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
    if (existing) throw new ForbiddenException('Already joined');
    await this.prisma.member.create({ data: { workspaceId, userId, role: 'member' } });
    return workspaceId;
  }
}
