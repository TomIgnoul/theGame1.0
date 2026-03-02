export interface SyncResult {
    datasetsSynced: number;
    gemsUpserted: number;
    gemsDeactivated: number;
}
export declare function syncDatasets(): Promise<SyncResult>;
//# sourceMappingURL=sync.service.d.ts.map