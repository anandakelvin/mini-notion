// Forwards Socket.io (polling and WebSocket upgrade) to the backend.
const BACKEND = "https://mini-notion-api.kelvin.us.ci";

export function onRequest({ request }: { request: Request }) {
	const url = new URL(request.url);
	return fetch(new Request(BACKEND + url.pathname + url.search, request));
}
