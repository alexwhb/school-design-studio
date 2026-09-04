export type RouteQuery = Record<string, string | undefined>;
export declare function readQuery(): RouteQuery;
export declare function replaceQuery(next: RouteQuery): void;
