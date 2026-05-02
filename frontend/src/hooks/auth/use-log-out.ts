import { useFetch } from "frontend/src/hooks/core/use-fetch";

export function useLogOut() {
	return useFetch(
		`http://localhost:3000/auth/logout`,
		{
			method: "POST",
			manual: true,
		}
	)
}