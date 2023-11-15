import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  AUTHORIZATION_HEADER_NAME,
  IAM_CONFIG_OPTIONS,
  REQUEST_ID_HEADER_NAME,
} from './const'
import { Request } from 'express'
import { Config } from './config'
import { Reflector } from '@nestjs/core'
import { IAMActions as IAMActions } from './iam-actions.decorator'

@Injectable()
export class IAMGuard implements CanActivate {
  constructor(
    @Inject(IAM_CONFIG_OPTIONS) private readonly config: Config,
    @Inject(Reflector.name)
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()
    const token = this.getToken(request)
    const requestId = this.getRequestId(request)
    if (!token || !requestId) {
      return false
    }

    let id = 'any'
    if (request.method === 'POST' && request.params['id']) {
      id = request.params['id']
    }

    const actions: string[] = this.reflector.get(
      IAMActions,
      context.getHandler(),
    )
    if (!actions || actions.length === 0) {
      // By default, if no action is specifid, permission will be denied
      return false
    }

    const payload = {
      requestId,
      token,
      resource: {
        kind: this.config.resource,
        id,
      },
      actions,
    }

    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.log(error)
      return undefined
    })

    if (!response || !response.ok) {
      return false
    }
    const result = await response.json()

    // Ensure that all requested actions have been granted
    const accessGranted = actions.reduce((granted, action) => {
      const actionGranted = result[action] === true
      return granted && actionGranted
    }, true)

    return accessGranted
  }

  getToken(request: Request): string {
    const authHeader: string = request.headers[AUTHORIZATION_HEADER_NAME]
    if (!authHeader) {
      return undefined
    }

    const [bearer, token, ...rest] = authHeader
      .split(' ')
      .filter((item) => item !== '')

    const isValidFormat =
      bearer.toLowerCase() === 'bearer' && token && rest.length === 0
    return isValidFormat ? token : undefined
  }

  getRequestId(request: Request): string {
    const requestId: string = request.headers[REQUEST_ID_HEADER_NAME] as string
    return requestId ? requestId : undefined
  }
}
