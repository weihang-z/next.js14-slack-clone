import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { MembersModule } from './members/members.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ReactionsModule } from './reactions/reactions.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 静态文件服务 - 用于提供上传的文件
    ServeStaticModule.forRoot({
      // Use project root uploads directory at runtime, not dist/uploads
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    WorkspacesModule,
    MembersModule,
    ChannelsModule,
    MessagesModule,
    ConversationsModule,
    ReactionsModule,
    PrismaModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
