import { ping } from './db';
import { findById, findByTheme, isValidTheme } from './modules/gems/gems.repo';
import { generateRoute, type RouteRequest } from './modules/routes/routes.service';
import { buildChatMessages } from './modules/chat/promptService';
import { generateChatReply } from './modules/chat/aiService';
import { getOrCreateStory } from './modules/stories/stories.service';
import { syncDatasets } from './modules/admin/sync.service';
import { parseFrontendAnalyticsEvent, recordAnalyticsEventSafe } from './modules/analytics/service';
import { getAnalyticsBreakdowns, getAnalyticsOverview, getAnalyticsTimeseries } from './modules/analytics/read.service';
export interface AppDependencies {
    pingDb: typeof ping;
    findGemsByTheme: typeof findByTheme;
    findGemById: typeof findById;
    validateTheme: typeof isValidTheme;
    generateRoute: (request: RouteRequest) => ReturnType<typeof generateRoute>;
    buildChatMessages: typeof buildChatMessages;
    generateChatReply: typeof generateChatReply;
    getOrCreateStory: typeof getOrCreateStory;
    syncDatasets: typeof syncDatasets;
    parseFrontendAnalyticsEvent: typeof parseFrontendAnalyticsEvent;
    recordAnalyticsEventSafe: typeof recordAnalyticsEventSafe;
    getAnalyticsOverview: typeof getAnalyticsOverview;
    getAnalyticsTimeseries: typeof getAnalyticsTimeseries;
    getAnalyticsBreakdowns: typeof getAnalyticsBreakdowns;
}
export declare function createApp(overrides?: Partial<AppDependencies>): import("express-serve-static-core").Express;
declare const _default: import("express-serve-static-core").Express;
export default _default;
//# sourceMappingURL=app.d.ts.map