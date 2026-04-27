import { Injectable } from "@nestjs/common";
import { Note } from "backend/src/prisma/generated/prisma/client";
import { PrismaService } from "backend/src/prisma/prisma.service";

@Injectable()
export class NoteService  {
	constructor(
		private readonly prisma: PrismaService,
	) {}

	async getNotes(userId: number): Promise<Note[]> {
		return this.prisma.note.findMany({
			where: {
				user_id: userId,
			}
		})
	}

	async getNoteById(noteId: number): Promise<Note | null> {
		return this.prisma.note.findUnique({
			where: {
				id: noteId,
			}
		})
	}

	async createNote(userId: number, title: string): Promise<Note> {
		return this.prisma.note.create({
			data: {
				user_id: userId,
				title,
			}
		})
	}

	async updateNote(noteId: number, title: string): Promise<Note> {
		return this.prisma.note.update({
			where: {
				id: noteId,
			},
			data: {
				title,
			}
		})
	}

	async deleteNote(noteId: number): Promise<Note> {
		return this.prisma.note.delete({
			where: {
				id: noteId,
			}
		})
	}
}