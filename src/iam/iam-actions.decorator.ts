import { Reflector } from '@nestjs/core'

export const IAMActions = Reflector.createDecorator<string[]>()
