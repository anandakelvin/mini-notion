import { OnEvent } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { jwtConstants } from "backend/src/auth/constants";
import { Server, Socket } from "socket.io";
import { NoteService } from "./note.service";

@WebSocketGateway({
	cors: {
		origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
		credentials: true,
	},
})
export class NoteGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;

	constructor(
		private readonly jwtService: JwtService,
		private readonly noteService: NoteService,
	) {}

	async handleConnection(client: Socket) {
		try {
			const cookieHeader = client.handshake.headers.cookie || "";
			const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, curr: string) => {
				const [key, value] = curr.split("=").map((c: string) => c.trim());
				if (key && value) {
					acc[key] = decodeURIComponent(value);
				}
				return acc;
			}, {} as Record<string, string>);

			const token = cookies["access_token"];
			if (!token) {
				client.disconnect();
				return;
			}

			const payload = this.jwtService.verify(token, {
				secret: jwtConstants.secret,
			});
			client.data.user = { userId: payload.sub, email: payload.email };
		} catch (error) {
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket) {
		if (client.data.user) {
			this.server.emit("user_left", { email: client.data.user.email });
		}
	}

	private getColor(email: string): string {
		const colors = [
			"#ef4444",
			"#f97316",
			"#f59e0b",
			"#10b981",
			"#06b6d4",
			"#3b82f6",
			"#6366f1",
			"#8b5cf6",
			"#d946ef",
			"#ec4899",
		];
		let hash = 0;
		for (let i = 0; i < email.length; i++) {
			hash = email.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % colors.length;
		return colors[index];
	}

	@SubscribeMessage("cursor_move")
	handleCursorMove(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { noteId: number; pos: number; isTitle?: boolean },
	) {
		if (!client.data.user) return;
		const color = this.getColor(client.data.user.email);
		client.to(`note_${data.noteId}`).emit("cursor_move", {
			email: client.data.user.email,
			pos: data.pos,
			color,
			isTitle: data.isTitle,
		});
	}

	@SubscribeMessage("join_note")
	async handleJoinNote(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { noteId: number },
	) {
		if (!client.data.user) {
			client.emit("error", { message: "Unauthorized" });
			return;
		}

		try {
			const { noteId } = data;
			// Verify note exists and belongs to the connected user
			await this.noteService.getNoteById(noteId, client.data.user.userId);
			client.join(`note_${noteId}`);
		} catch (error) {
			client.emit("error", { message: "Access to note denied" });
		}
	}

	@OnEvent("note.*.updated")
	handleNoteUpdated(updatedNote: any) {
		const noteId = updatedNote.id;
		this.server.to(`note_${noteId}`).emit("note_updated", updatedNote);
	}
}
