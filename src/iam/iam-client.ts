import { Inject, Injectable } from '@nestjs/common'
import { ResourceInfo } from '../types/resource-info.type'
import { AccessInfo } from '../types/access-info.type'
import { CONFIG_OPTIONS } from '../const'
import { Config } from 'src/config'

@Injectable()
export class IAMClient {
  constructor(
    @Inject(CONFIG_OPTIONS)
    private readonly config: Config,
  ) {}

  async checkResource(info: ResourceInfo): Promise<AccessInfo> {
    const payload = {
      requestId: info.requestId,
      token: info.token,
      resource: {
        kind: this.config.resource,
        id: info.resource.id,
      },
      actions: info.actions,
    }

    const iamUrl = this.config.url + '/resource/check'
    const response = await fetch(iamUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return this.denyAll(info.actions)
    }

    const result: AccessInfo = await response.json()
    return result
  }

  private denyAll(actions: Array<string>): AccessInfo {
    return actions.reduce((result, action) => {
      result[action] = false
      return result
    }, {})
  }
}
