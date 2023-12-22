import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { AUTHORIZATION_HEADER_NAME, REQUEST_ID_HEADER_NAME } from '../const'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import { IAMActions as IAMActions } from './iam-actions.decorator'
import { IAMClient } from './iam-client'
import { ResourceInfo } from 'src/types/resource-info.type'

@Injectable()
export class IAMGuard implements CanActivate {
  constructor(
    private readonly client: IAMClient,
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

    const info: ResourceInfo = {
      requestId,
      token,
      resource: {
        id,
      },
      actions,
    }

    const result = await this.client.checkResource(info)

    // Ensure that all requested actions have been granted
    const accessGranted = actions.reduce((granted, action) => {
      const actionGranted = result[action] === true
      return granted && actionGranted
    }, true)

    return accessGranted
  }

  private getToken(request: Request): string {
    const authHeader = request.headers[AUTHORIZATION_HEADER_NAME] as string
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

  private getRequestId(request: Request): string {
    const requestId: string = request.headers[REQUEST_ID_HEADER_NAME] as string
    return requestId ? requestId : undefined
  }
}
