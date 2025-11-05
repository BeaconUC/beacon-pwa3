import {createBrowserClient} from '@supabase/ssr'
import {ClientType, BeaconClient} from "@/lib/unified";
import {Database} from "@/lib/types";

export function createSpaClient() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createBrowserClient<Database, "public", Database["public"]>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function createSpaBeaconClient() {
    const client = createSpaClient();
    // This must be some bug that SupabaseClient is not properly recognized, so must be ignored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new BeaconClient(client as any, ClientType.SPA);
}

export async function createSpaBeaconClientAuthenticated() {
    const client = createSpaClient();
    const user = await client.auth.getSession();
    if (!user.data || !user.data.session) {
        window.location.href = '/auth/login';
    }
    // This must be some bug that SupabaseClient is not properly recognized, so must be ignored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new BeaconClient(client as any, ClientType.SPA);
}