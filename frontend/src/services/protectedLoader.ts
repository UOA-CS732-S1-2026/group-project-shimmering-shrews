import { redirect, type LoaderFunctionArgs } from "react-router-dom"
import { getSupabaseClient } from "../lib/supabase"

export type User = {
	id: string
	email: string
	[key: string]: unknown
}

/**
 * Fetches the authenticated user for a route using the local Supabase session.
 *
 * This loader runs before the route renders and ensures the user is authenticated.
 * If the session is missing, the user is redirected to the login page.
 *
 * @param {LoaderFunctionArgs} args - React Router loader arguments
 * @param {Request} args.request - The incoming navigation request
 *
 * @returns {Promise<User | Response>}
 * Returns the authenticated user object if valid,
 * otherwise returns a redirect response to the login page.
 */
export async function protectedLoader({ request }: LoaderFunctionArgs): Promise<User | Response>  {
	const supabase = getSupabaseClient()
	const { data } = await supabase.auth.getSession()
  	const session = data.session

	if (!session?.access_token) {
		return redirect("/login?from=" + new URL(request.url).pathname)
	}

    return {
      id: session.user.id,
      email: session.user.email ?? "",
    }
}
