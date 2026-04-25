import { Module } from '@nestjs/common';
import { AuthService } from 'src/app/auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AuthService, AppService],
})
export class AppModule {}
