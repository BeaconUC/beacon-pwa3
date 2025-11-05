import {SupabaseClient} from "@supabase/supabase-js";
import {Database} from "@/lib/types";
import type {
  CreateOutageReportRequest,
  CreateOutageReportResponse,
  VerifyOutageRequest,
  VerifyOutageResponse
} from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/public_pb";
import {PublicBeaconService} from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/public_pb";
import {type Client, createClient} from "@connectrpc/connect";
import {createConnectTransport} from "@connectrpc/connect-web";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL!;
const transport = createConnectTransport({
  baseUrl: API_GATEWAY_URL,
});

class ApiGatewayClient {
  private static instance: Client<typeof PublicBeaconService> | null = null;

  static getInstance(baseUrl: string = API_GATEWAY_URL) {
    if (!ApiGatewayClient.instance) {
      ApiGatewayClient.instance = createClient<typeof PublicBeaconService>(
        PublicBeaconService,
        transport
      )
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
  private readonly apiGatewayClient: Client<typeof PublicBeaconService>;
  private clientType: ClientType;

  constructor(
    client: SupabaseClient<Database, "public", "public">,
    clientType: ClientType,
    apiGatewayClient: Client<typeof PublicBeaconService> = ApiGatewayClient.getInstance()
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

  async logout() {
    const {error} = await this.supabaseClient.auth.signOut({
      scope: 'local',
    });
    if (error) throw error;
    if (this.clientType === ClientType.SPA) {
      window.location.href = '/auth/login';
    }
  }

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

  async getOutagesList(
    page: number = 1,
    pageSize: number = 100,
    order: string = 'created_at',
    is_resolved: boolean | null = false
  ) {
    let query = this.supabaseClient.from('outages')
      .select('*')
      .range(page * pageSize - pageSize, page * pageSize - 1)
      .order(order)
    return is_resolved ? query.eq('status', "resolved") : query
  }

  async createOutageReport(req: CreateOutageReportRequest): Promise<CreateOutageReportResponse> {
    return this.apiGatewayClient.createOutageReport(req)
  }

  async verifyOutageReport(req: VerifyOutageRequest): Promise<VerifyOutageResponse> {
    return this.apiGatewayClient.verifyOutage(req)
  }

  getSupabaseClient() {
    return this.supabaseClient;
  }
}
