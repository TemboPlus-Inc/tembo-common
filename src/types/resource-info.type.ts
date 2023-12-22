export interface ResourceInfo {
  requestId: string
  token: string
  resource: {
    id: string
    attr?: {
      [key: string]: any
    }
  }
  actions: Array<string>
}
