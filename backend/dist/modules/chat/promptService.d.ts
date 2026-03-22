import type { AiMessage } from '../ai/aiRuntime';
import type { Gem } from '../gems/gems.repo';
type ChatPromptGem = Pick<Gem, 'title' | 'theme' | 'address' | 'descriptionShort' | 'practicalInfo'>;
export declare function buildChatMessages(gem: ChatPromptGem, message: string): AiMessage[];
export {};
//# sourceMappingURL=promptService.d.ts.map