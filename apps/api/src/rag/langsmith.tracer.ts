import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RunTree, Client } from 'langsmith';

@Injectable()
export class LangSmithTracer {
  constructor(private readonly configService: ConfigService) {}

  async trace(
    question: string,
    fn: (runTree: RunTree) => Promise<void>,
  ): Promise<void> {
    const client = new Client({
      apiKey: this.configService.get<string>('LANGSMITH_API_KEY'),
      apiUrl: this.configService.get<string>('LANGSMITH_ENDPOINT'),
    });

    const runTree = new RunTree({
      name: 'RAG Pipeline',
      run_type: 'chain',
      inputs: { question },
      project_name: this.configService.get<string>('LANGSMITH_PROJECT'),
      client,
    });

    try {
      await fn(runTree);
      await runTree.end({ status: 'completed' });
    } catch (error) {
      await runTree.end({ status: 'failed' }, String(error));
      throw error;
    } finally {
      await runTree.postRun();
    }
  }
}
