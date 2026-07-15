const mockEnd = jest.fn();
const mockPostRun = jest.fn();

jest.mock('langsmith', () => ({
  RunTree: jest.fn().mockImplementation((config: Record<string, unknown>) => {
    mockEnd.mockClear();
    mockPostRun.mockClear();
    const runTree = {
      end: (...args: unknown[]) => {
        mockEnd(...args);
        return Promise.resolve();
      },
      postRun: () => {
        mockPostRun();
        return Promise.resolve();
      },
      constructorArgs: config,
    };
    return runTree;
  }),
}));

import { ConfigService } from '@nestjs/config';
import { LangSmithTracer } from './langsmith.tracer';

describe('LangSmithTracer', () => {
  let tracer: LangSmithTracer;

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = { get: jest.fn().mockReturnValue('test-project') } as unknown as ConfigService;
    tracer = new LangSmithTracer(configService);
  });

  it('should call end with ready status and postRun on success', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    await tracer.trace('doc-1', fn);

    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ constructorArgs: expect.any(Object) }));
    expect(mockEnd).toHaveBeenCalledWith({ documentId: 'doc-1', status: 'ready' });
    expect(mockPostRun).toHaveBeenCalled();
  });

  it('should call end with failed status and rethrow on error', async () => {
    const error = new Error('boom');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(tracer.trace('doc-2', fn)).rejects.toThrow('boom');

    expect(mockEnd).toHaveBeenCalledWith({ documentId: 'doc-2', status: 'failed' }, 'Error: boom');
    expect(mockPostRun).toHaveBeenCalled();
  });

  it('should use project_name (not projectName or apiKey) in RunTree config', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    await tracer.trace('doc-3', fn);

    const RunTreeMock = jest.requireMock('langsmith').RunTree;
    const callConfig = RunTreeMock.mock.calls[0][0];
    expect(callConfig.project_name).toBe('test-project');
    expect(callConfig).not.toHaveProperty('projectName');
    expect(callConfig).not.toHaveProperty('apiKey');
    expect(callConfig).toMatchObject({
      name: 'Ingestion Pipeline',
      run_type: 'chain',
      inputs: { documentId: 'doc-3' },
    });
  });
});
