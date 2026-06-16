import { Module } from "@nestjs/common";
import { PrismaModule } from "backend/src/prisma/prisma.module";
import { AuthModule } from "backend/src/auth/auth.module";
import { NoteController } from "./note.controller";
import { NoteService } from "./note.service";
import { NoteGateway } from "./note.gateway";

@Module({
	imports: [PrismaModule, AuthModule],
	providers: [NoteService, NoteGateway],
	controllers: [NoteController]
})
export class NoteModule {}