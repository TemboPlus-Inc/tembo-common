import { DynamicModule, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from './const';
import { Config } from './config';

@Module({})
export class IAMModule {
  static register(config: Config): DynamicModule {
    return {
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: config,
        },
      ],
      exports: [],
      module: IAMModule,
    };
  }
}
