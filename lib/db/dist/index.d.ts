import * as schema from "./schema";
declare const pool: import("pg").Pool;
export { pool };
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export * from "./schema";
export * from "./migrations";
//# sourceMappingURL=index.d.ts.map