import { IAMGuard } from './iam.guard'

describe('IamGuard', () => {
  it('should be defined', () => {
    expect(new IAMGuard()).toBeDefined()
  })
})
