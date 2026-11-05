import { serverEnvSchema, type ServerEnv, getServerEnv, resetServerEnv } from "./server";
import { publicEnvSchema, type PublicEnv, getPublicEnv } from "./public";

export { serverEnvSchema, publicEnvSchema, getServerEnv, getPublicEnv, resetServerEnv };
export type { ServerEnv, PublicEnv };
export type Env = ServerEnv;

export function getEnv(): ServerEnv {
  return getServerEnv();
}

export function resetEnv(): void {
  resetServerEnv();
}
