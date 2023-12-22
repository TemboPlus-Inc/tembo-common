import { DynamicModule, Module } from '@nestjs/common'
import { Config } from './config'
import { CONFIG_OPTIONS } from './const'
import { IAMClient } from './iam/iam-client'

@Module({})
export class CommonModule {
  static config(config: Config): DynamicModule {
    return {
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: config,
        },
        IAMClient,
      ],
      exports: [IAMClient],
      module: CommonModule,
    }
  }
}
