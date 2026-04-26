import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "backend/src/auth/jwt-auth.guard";

import { NoteService } from "backend/src/note/note.service";
import { Note } from "backend/src/prisma/generated/prisma/client";
import { ReqUser } from "backend/src/shared/decorator/user.decorator";
import { IReqUser } from "backend/src/shared/types";
import { CreateNoteRequestBodyDto } from "shared/dto/note/body/create-note-body.dto";
import { UpdateNoteRequestBodyDto } from "shared/dto/note/body/update-note-body.dto";

@Controller('notes')
export class NoteController {
	constructor(private readonly noteService: NoteService) {}

	@UseGuards(JwtAuthGuard)
	@Get()
	async getNotes(@ReqUser() user: IReqUser): Promise<Note[]> {
		return this.noteService.getNotes(user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	async getNoteById(@Param('id') id: string): Promise<Note | null> {
		return this.noteService.getNoteById(Number(id));
	}

	@UseGuards(JwtAuthGuard)
	@Post()
	async createNote(@ReqUser() user: IReqUser, @Body() body: CreateNoteRequestBodyDto): Promise<Note> {
		return this.noteService.createNote(user.userId, body.title);
	}

	@UseGuards(JwtAuthGuard)
	@Put(':id')
	async updateNote(@Param('id') id: string, @Body() body: UpdateNoteRequestBodyDto): Promise<Note> {
		return this.noteService.updateNote(Number(id), body.title);
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	async deleteNote(@Param('id') id: string): Promise<undefined> {
		await this.noteService.deleteNote(Number(id));
	}
}