import { InjectionToken } from "@needle-di/core";
import { BOT_CONFIG } from "../config";
import type { Env } from "../env";

export const BOT_CONFIG_TOKEN = new InjectionToken<typeof BOT_CONFIG>("BOT_CONFIG_TOKEN");
export const ENV_CONFIG_TOKEN = new InjectionToken<Env>("ENV_CONFIG_TOKEN");
