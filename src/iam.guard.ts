import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  AUTHORIZATION_HEADER_NAME,
  CONFIG_OPTIONS,
  REQUEST_ID_HEADER_NAME,
} from './const';
import { Request } from 'express';
import { Config } from './config';
import { Reflector } from '@nestjs/core';
import { IAMAction as IAMActions } from './iam-actions.decorator';

@Injectable()
export class IAMGuard implements CanActivate {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly config: Config,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.getToken(request);
    const requestId = this.getRequestId(request);
    if (!token || !requestId) {
      return false;
    }

    let id = 'any';
    if (request.method === 'POST' && request.params['id']) {
      id = request.params['id'];
    }

    const actions = this.reflector.get(IAMActions, context.getHandler());
    if (!actions) {
      // By default, if not action is specifid, permission will be denied
      return false;
    }

    const payload = {
      requestId,
      token,
      resource: {
        kind: this.config.resource,
        id,
      },
      actions: ['wallet.create', 'wallet.update'],
    };

    const response = fetch(this.config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return true;
  }

  getToken(request: Request): string {
    const authHeader: string = request.headers[AUTHORIZATION_HEADER_NAME];
    if (!authHeader) {
      return undefined;
    }

    const [bearer, token, ...rest] = authHeader
      .split(' ')
      .filter((item) => item !== '');

    const isValidFormat =
      bearer.toLowerCase() === 'bearer' && token && rest.length === 0;
    return isValidFormat ? token : undefined;
  }

  getRequestId(request: Request): string {
    const requestId: string = request.headers[REQUEST_ID_HEADER_NAME] as string;
    return requestId ? requestId : undefined;
  }
}
