import crypto from "crypto";

export function createTempUser() {
  return {
    id: crypto.randomUUID(),
    name: `user_${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
  };
}
