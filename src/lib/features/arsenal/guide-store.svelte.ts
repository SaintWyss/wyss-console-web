import type { Guide, GuideBody } from '../../contracts/arsenal';
import type { GuideSection } from './guide';

/** The tools Arsenal shows: Claude Code and Codex have skills; OpenCode only its configuration. */
export type GuideTool = 'claude_code' | 'codex' | 'opencode';

export interface GuideClient {
  guide(): Promise<Guide>;
  guideBody(id: string): Promise<GuideBody>;
}

/**
 * What the Arsenal tree and its panel share: the tool and section chosen, the Guide read from disk,
 * and the card open. The Guide is read when Arsenal is first shown and again on request; a body is
 * read when its card opens, by the id the last read gave.
 */
export class GuideStore {
  tool = $state<GuideTool>('claude_code');
  section = $state<GuideSection>('origin:mine');
  guide = $state<Guide | null>(null);
  /** What is typed in the tree's search box: it filters the skill lists. */
  query = $state('');
  loading = $state(false);
  failed = $state(false);
  /** The entry whose card is open. */
  openId = $state<string | null>(null);
  body = $state<GuideBody | null>(null);
  bodyLoading = $state(false);
  bodyFailed = $state(false);

  constructor(private readonly client: GuideClient) {}

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.failed = false;
    try {
      this.guide = await this.client.guide();
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  /** Loads the Guide once; later calls keep what was read. */
  ensure(): void {
    if (this.guide === null && !this.loading && !this.failed) void this.load();
  }

  choose(next: { tool?: GuideTool; section?: GuideSection }): void {
    if (next.tool !== undefined) this.tool = next.tool;
    if (next.section !== undefined) this.section = next.section;
    this.close();
  }

  async open(id: string): Promise<void> {
    this.openId = id;
    this.body = null;
    this.bodyFailed = false;
    this.bodyLoading = true;
    try {
      const body = await this.client.guideBody(id);
      if (this.openId === id) this.body = body;
    } catch {
      if (this.openId === id) this.bodyFailed = true;
    } finally {
      if (this.openId === id) this.bodyLoading = false;
    }
  }

  close(): void {
    this.openId = null;
    this.body = null;
    this.bodyLoading = false;
    this.bodyFailed = false;
  }
}
