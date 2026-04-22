import { redirect, type LoaderFunctionArgs } from "react-router-dom"
import { supabase } from "../lib/supabase"

export type User = {
	id: string
	email: string
	[key: string]: unknown
}

/**
 * Fetches the authenticated user for a route using the backend session validator.
 * 
 * This loader runs before the route renders and ensures the user is authenticated.
 * If the session is invalid or missing, the user is redirected to the login page.
 * 
 * @param {LoaderFunctionArgs} args - React Router loader arguments
 * @param {Request} args.request - The incoming navigation request
 * 
 * @returns {Promise<User | Response>}
 * Returns the authenticated user object if valid,
 * otherwise returns a redirect response to the login page.
 */
export async function protectedLoader({ request }: LoaderFunctionArgs): Promise<User | Response>  {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

	const { data } = await supabase.auth.getSession()
  	const token = data.session?.access_token

	if (!token) {
		return redirect("/login?from=" + new URL(request.url).pathname)
	}

	const response = await fetch(`${BACKEND_URL}/api/auth/validate-session`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)

	if (!response.ok) {
		return redirect("/login?from=" + new URL(request.url).pathname)
	}

    const dataJson = await response.json();

    if (!dataJson.valid) {
    	return redirect("/login?from=" + new URL(request.url).pathname);
    }

    return dataJson.user;
}