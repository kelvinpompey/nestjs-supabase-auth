import { Request } from "express";
import { JwtFromRequestFunction } from "passport-jwt";
import { Strategy } from "passport-strategy";

import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";
import { UNAUTHORIZED, SUPABASE_AUTH } from "./constants";
import { SupabaseAuthUser } from "./user.type";
import { SupabaseAuthStrategyOptions } from "./interface/options.interface";

export class SupabaseAuthStrategy extends Strategy {
  readonly name = SUPABASE_AUTH;
  private supabase: SupabaseClient;
  private extractor: JwtFromRequestFunction;
  success: (user: any, info: any) => void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  fail: Strategy["fail"]

  constructor(options: SupabaseAuthStrategyOptions) {
    super();
    if (!options.extractor) {
      throw new Error(
        "\n Extractor is not a function. You should provide an extractor. \n Read the docs: https://github.com/tfarras/nestjs-firebase-auth#readme"
      );
    }

    this.supabase = createClient(
      options.supabaseUrl,
      options.supabaseKey,
      (options.supabaseOptions = {})
    );
    this.extractor = options.extractor;
  }

  async validate(payload: SupabaseAuthUser): Promise<SupabaseAuthUser> {
    return payload;
  }

  authenticate(req: Request): void {
    const idToken = this.extractor(req);

    if (!idToken) {
      this.fail(UNAUTHORIZED, 401);
      return;
    }

    this.supabase.auth.api
      .getUser(idToken)
      .then((res) => this.validateSupabaseResponse(res))
      .catch((err) => {
        this.fail(err.message, 401);
      });
  }

  private async validateSupabaseResponse({ data }: any) {
    //const result = await this.validate(data);
    if (data) {
      this.success(data, {});
      return;
    }
    this.fail(UNAUTHORIZED, 401);
    return;
  }
}
