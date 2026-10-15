import { describe, expect, it } from 'vitest'
import committedConfig from '../../config/access.json'
import { parseAccessConfig } from './accessConfig'

describe('access config', () => {
  it('keeps the committed config file valid', () => {
    expect(parseAccessConfig(committedConfig)).toEqual(committedConfig)
  })

  it('rejects values that are not true or false', () => {
    expect(() => parseAccessConfig({ allowNewAccounts: 'false', googleSignIn: false })).toThrow('true/false')
    expect(() => parseAccessConfig({ allowNewAccounts: true })).toThrow('true/false')
  })
})
