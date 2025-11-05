import {SupabaseClient} from "@supabase/supabase-js";
import {Database} from "@/lib/types";
import {PublicBeaconService} from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/public_pb";
import {createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-node";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL!;

class ApiGatewayClient {
    private static instance: ReturnType<typeof createClient> | null = null;

    static getInstance(baseUrl: string = API_GATEWAY_URL) {
        if (!ApiGatewayClient.instance) {
            ApiGatewayClient.instance = createClient(
                PublicBeaconService,
                createConnectTransport({
                    httpVersion: "1.1",
                    baseUrl,
                })
            );
        }
        return ApiGatewayClient.instance;
    }
}

export enum ClientType {
    SERVER = 'server',
    SPA = 'spa'
}

export class BeaconClient {
    private readonly supabaseClient: SupabaseClient<Database, "public", "public">;
    private readonly apiGatewayClient;
    private clientType: ClientType;

    constructor(
        client: SupabaseClient<Database, "public", "public">,
        clientType: ClientType,
        apiGatewayClient: ReturnType<typeof createClient> = ApiGatewayClient.getInstance()
    ) {
        this.supabaseClient = client;
        this.clientType = clientType;
        this.apiGatewayClient = apiGatewayClient;
    }

    // async loginEmail(email: string, password: string) {
    //     return this.client.auth.signInWithPassword({
    //         email: email,
    //         password: password
    //     });
    // }
    //
    // async registerEmail(email: string, password: string) {
    //     return this.client.auth.signUp({
    //         email: email,
    //         password: password
    //     });
    // }

    async exchangeCodeForSession(code: string) {
        return this.supabaseClient.auth.exchangeCodeForSession(code);
    }

    // async resendVerificationEmail(email: string) {
    //     return this.client.auth.resend({
    //         email: email,
    //         type: 'signup'
    //     })
    // }

    // async logout() {
    //     const { error } = await this.client.auth.signOut({
    //         scope: 'local',
    //     });
    //     if (error) throw error;
    //     if(this.clientType === ClientType.SPA) {
    //         window.location.href = '/auth/login';
    //     }
    // }

    async uploadFile(myId: string, filename: string, file: File) {
        filename = filename.replace(/[^0-9a-zA-Z!\-_.*'()]/g, '_');
        filename = myId + "/" + filename
        return this.supabaseClient.storage.from('files').upload(filename, file);
    }

    async getFiles(myId: string) {
        return this.supabaseClient.storage.from('files').list(myId)
    }

    async deleteFile(myId: string, filename: string) {
        filename = myId + "/" + filename
        return this.supabaseClient.storage.from('files').remove([filename])
    }

    async shareFile(myId: string, filename: string, timeInSec: number, forDownload: boolean = false) {
        filename = myId + "/" + filename
        return this.supabaseClient.storage.from('files').createSignedUrl(filename, timeInSec, {
            download: forDownload
        });

    }

    async getOutagesList(page: number = 1, pageSize: number = 100, order: string = 'created_at', is_resolved: boolean | null = false) {
        let query = this.supabaseClient.from('outages').select('*').range(page * pageSize - pageSize, page * pageSize - 1).order(order)
        if (is_resolved) {
            return query.eq('status', "resolved")
        } else {
            return query
        }
    }

    async createOutageReport(row: Database["public"]["Tables"]["outage_reports"]["Insert"]) {
        return this.api_gateway
    }

    async removeTask (id: number) {
        return this.supabaseClient.from('todo_list').delete().eq('id', id)
    }

    async updateAsDone (id: number) {
        return this.supabaseClient.from('todo_list').update({done: true}).eq('id', id)
    }

    getSupabaseClient() {
        return this.supabaseClient;
    }


}
