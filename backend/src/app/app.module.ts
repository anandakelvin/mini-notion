import { ArgumentsHost, Catch, HttpException, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, BaseExceptionFilter } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'backend/src/auth/auth.module';
import { NoteModule } from 'backend/src/note/note.module';
import { PrismaModule } from 'backend/src/prisma/prisma.module';
import { ZodSerializationException, ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// http-exception.filter
@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error(`ZodSerializationException: ${zodError.message}`);
      }
    }

    super.catch(exception, host);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    EventEmitterModule.forRoot(),
    PrismaModule, 
    AuthModule, 
    NoteModule
  ],
  controllers: [AppController],
  providers: [{
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  }, {
    provide: APP_INTERCEPTOR,
    useClass: ZodSerializerInterceptor
  }, {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter
  }, AppService],
})
export class AppModule {}
