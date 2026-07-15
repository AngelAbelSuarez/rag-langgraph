import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RunTree } from 'langsmith';

@Injectable()
export class LangSmithTracer {
  constructor(private readonly configService: ConfigService) {}

  async trace(
    documentId: string,
    fn: (runTree: RunTree) => Promise<void>,
  ): Promise<void> {
    const runTree = new RunTree({
      name: 'Ingestion Pipeline',
      run_type: 'chain',
      inputs: { documentId },
      project_name: this.configService.get<string>('LANGSMITH_PROJECT'),
    });

    try {
      await fn(runTree);
      await runTree.end({ documentId, status: 'ready' });
    } catch (error) {
      await runTree.end({ documentId, status: 'failed' }, String(error));
      throw error;
    } finally {
      await runTree.postRun();
    }
  }
}