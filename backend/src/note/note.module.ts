import { Module } from "@nestjs/common";
import { PrismaModule } from "backend/src/prisma/prisma.module";
import { NoteController } from "./note.controller";
import { NoteService } from "./note.service";

@Module({
	imports: [PrismaModule],
	providers: [NoteService],
	controllers: [NoteController]
})
export class NoteModule {}