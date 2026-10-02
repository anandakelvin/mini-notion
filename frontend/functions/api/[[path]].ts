// Forwards /api/* to the backend, so the browser sees one site and the HttpOnly cookie is first-party.
const BACKEND = "https://mini-notion-api.kelvin.us.ci";

export function onRequest({ request }: { request: Request }) {
	const url = new URL(request.url);
	const target = BACKEND + url.pathname + url.search;
	return fetch(new Request(target, request));
}
