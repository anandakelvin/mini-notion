import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { NoteService } from "./note.service";
import { OnEvent } from "@nestjs/event-emitter";
import { jwtConstants } from "backend/src/auth/constants";

@WebSocketGateway({
	cors: {
		origin: "http://localhost:5173",
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
		// Connection cleanup handled automatically by Socket.io
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
