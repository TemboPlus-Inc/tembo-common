/**
 * Configuration Interface for the Tembo Essentials module
 */
export interface Config {
  /**
   * The base API URL of the IAM server.
   */
  url: string

  /**
   * The name of the resource to be used in Cerbos policies when checking for access.
   */
  resource: string
}
