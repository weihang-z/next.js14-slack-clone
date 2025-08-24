import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { MembersModule } from './members/members.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ReactionsModule } from './reactions/reactions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UsersModule, WorkspacesModule, MembersModule, ChannelsModule, MessagesModule, ConversationsModule, ReactionsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
