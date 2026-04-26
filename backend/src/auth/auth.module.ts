import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "backend/src/auth/auth.controller";
import { jwtConstants } from "backend/src/auth/constants";
import { JwtStrategy } from "backend/src/auth/jwt-strategy";
import { PrismaModule } from "backend/src/prisma/prisma.module";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}