export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class AiRuntimeError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare function generateAiText(messages: AiMessage[]): Promise<string>;
//# sourceMappingURL=aiRuntime.d.ts.map