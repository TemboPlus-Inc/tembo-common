import { SetMetadata } from '@nestjs/common';

export const IAMAction = (...args: string[]) => SetMetadata('iam-action', args);
