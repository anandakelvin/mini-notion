import { API_URL } from "frontend/src/lib/utils"
import { useFetch } from "frontend/src/hooks/core/use-fetch";

export function useLogOut() {
	return useFetch(
		`${API_URL}/auth/logout`,
		{
			method: "POST",
			manual: true,
		}
	)
}