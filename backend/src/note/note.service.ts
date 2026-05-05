import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Note } from "backend/src/prisma/generated/prisma/client";
import { PrismaService } from "backend/src/prisma/prisma.service";
import { concat, fromEvent, map, Observable, of } from "rxjs";

@Injectable()
export class NoteService  {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async getNotes(userId: number): Promise<Note[]> {
		return this.prisma.note.findMany({
			where: {
				user_id: userId,
			}
		})
	}

	async getNoteById(noteId: number): Promise<Note> {
		return this.prisma.note.findUniqueOrThrow({
			where: {
				id: noteId,
			}
		})
	}

	async streamNoteById(noteId: number): Promise<Observable<MessageEvent<Note>>> {
		const note = await this.getNoteById(noteId);
		const initialEvent$ = of({
			data: note,
		} as MessageEvent<Note>)
		const liveEvents$ = fromEvent(this.eventEmitter, `note.${noteId}.updated`)
			.pipe(map(
				note => ({data: note} as MessageEvent<Note>),
			))

		return concat(initialEvent$, liveEvents$)
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
		const updatedNote = await this.prisma.note.update({
			where: {
				id: noteId,
			},
			data: {
				title,
			}
		})
		this.eventEmitter.emit(`note.${noteId}.updated`, updatedNote)
		return updatedNote
	}

	async deleteNote(noteId: number): Promise<Note> {
		return this.prisma.note.delete({
			where: {
				id: noteId,
			}
		})
	}
}