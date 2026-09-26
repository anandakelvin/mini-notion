import { ConflictException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "backend/src/prisma/prisma.service";

@Injectable()
export class NoteService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	private async saveBlocks(noteId: number, blocks: any[], parentId: number | null, tx: any) {
		let orderIndex = 0;
		for (const block of blocks) {
			let dbType = "text";
			if (block.type === "checkListItem") {
				dbType = "checklist";
			} else if (block.type === "image") {
				dbType = "image";
			} else if (block.type === "codeBlock") {
				dbType = "code";
			} else {
				dbType = block.type;
			}

			const blockData = {
				id: block.id,
				props: block.props,
				content: block.content,
			};
			const serializedContent = JSON.stringify(blockData);

			const createdBlock = await tx.block.create({
				data: {
					note_id: noteId,
					parent_id: parentId,
					type: dbType,
					content: serializedContent,
					order_index: orderIndex++,
				},
			});

			if (block.children && block.children.length > 0) {
				await this.saveBlocks(noteId, block.children, createdBlock.id, tx);
			}
		}
	}

	private reconstructBlocks(dbBlocks: any[]): any[] {
		const blocksByParent = new Map<number | null, any[]>();
		for (const dbBlock of dbBlocks) {
			const parentId = dbBlock.parent_id;
			if (!blocksByParent.has(parentId)) {
				blocksByParent.set(parentId, []);
			}
			blocksByParent.get(parentId)!.push(dbBlock);
		}

		for (const list of blocksByParent.values()) {
			list.sort((a, b) => a.order_index - b.order_index);
		}

		const buildTree = (parentId: number | null): any[] => {
			const list = blocksByParent.get(parentId) || [];
			const result: any[] = [];
			for (const dbBlock of list) {
				let parsedData: any = {};
				try {
					parsedData = JSON.parse(dbBlock.content);
				} catch (e) {
					parsedData = {
						id: String(dbBlock.id),
						props: {},
						content: dbBlock.content,
					};
				}

				let bnType = dbBlock.type;
				if (dbBlock.type === "checklist") {
					bnType = "checkListItem";
				} else if (dbBlock.type === "image") {
					bnType = "image";
				} else if (dbBlock.type === "code") {
					bnType = "codeBlock";
				}

				const block: any = {
					id: parsedData.id || String(dbBlock.id),
					type: bnType,
					props: parsedData.props || {},
					content: parsedData.content || [],
					children: buildTree(dbBlock.id),
				};
				result.push(block);
			}
			return result;
		};

		return buildTree(null);
	}

	async getNotes(userId: number): Promise<any[]> {
		const notes = await this.prisma.note.findMany({
			where: {
				user_id: userId,
			},
			include: {
				blocks: true,
			}
		});
		return notes.map(note => ({
			...note,
			content: this.reconstructBlocks(note.blocks),
		}));
	}

	async getNoteById(noteId: number, userId: number): Promise<any> {
		const note = await this.prisma.note.findFirstOrThrow({
			where: {
				id: noteId,
				user_id: userId,
			},
			include: {
				blocks: true,
			}
		});
		return {
			...note,
			content: this.reconstructBlocks(note.blocks),
		};
	}

	async createNote(userId: number, title: string): Promise<any> {
		const note = await this.prisma.note.create({
			data: {
				user_id: userId,
				title,
			},
		});
		return {
			...note,
			content: [],
		};
	}

	async updateNote(
		noteId: number,
		userId: number,
		email: string,
		title: string,
		content?: any,
		updatedAt?: string | Date
	): Promise<any> {
		const note = await this.prisma.note.findFirstOrThrow({
			where: {
				id: noteId,
				user_id: userId,
			}
		});

		// Optimistic Concurrency Control
		if (updatedAt) {
			const clientTime = new Date(updatedAt).getTime();
			const dbTime = note.updated_at.getTime();
			if (Math.abs(clientTime - dbTime) > 1000) {
				throw new ConflictException(
					"The note has been updated by another user or session. Please reload."
				);
			}
		}

		const updatedNote = await this.prisma.$transaction(async (tx) => {
			await tx.note.update({
				where: {
					id: noteId,
				},
				data: {
					title,
					last_edited_by: email,
				}
			});

			if (content !== undefined) {
				await tx.block.deleteMany({
					where: {
						note_id: noteId,
					}
				});
				await this.saveBlocks(noteId, content, null, tx);
			}

			const finalNote = await tx.note.findUniqueOrThrow({
				where: {
					id: noteId,
				},
				include: {
					blocks: true,
				}
			});

			return {
				...finalNote,
				content: this.reconstructBlocks(finalNote.blocks),
			};
		});

		this.eventEmitter.emit(`note.${noteId}.updated`, updatedNote);
		return updatedNote;
	}

	async deleteNote(noteId: number, userId: number): Promise<void> {
		await this.prisma.note.findFirstOrThrow({
			where: {
				id: noteId,
				user_id: userId,
			}
		});

		await this.prisma.$transaction(async (tx) => {
			await tx.block.deleteMany({
				where: {
					note_id: noteId,
				}
			});
			await tx.note.delete({
				where: {
					id: noteId,
				}
			});
		});
	}
}