import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { EnvSchema } from './env.js';

export * from './env.js';

export const ConfigModule = NestConfigModule.forRoot({
  validate: (config: Record<string, unknown>) => EnvSchema.parse(config),
  isGlobal: true,
});
