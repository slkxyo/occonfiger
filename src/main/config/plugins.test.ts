import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readConfig, writeConfig } from './io'
import { deletePlugin, listPlugins, pluginName, setPluginEnabled } from './plugins'

let dir = ''
let configFile = ''
let disabledFile = ''

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'occ-plugins-'))
  configFile = join(dir, 'opencode.jsonc')
  disabledFile = join(dir, '.occonfiger', 'disabled-plugins.json')
})

afterEach(() => rmSync(dir, { recursive: true, force: true }))

function pluginArray(): unknown[] {
  const data = readConfig(configFile).data
  return Array.isArray(data.plugin) ? data.plugin : []
}

describe('pluginName', () => {
  it('extracts the display name from every supported shape', () => {
    expect(pluginName('opencode-wakatime')).toBe('opencode-wakatime')
    expect(pluginName(['opencode-acme', { strict: true }])).toBe('opencode-acme')
    expect(pluginName({ package: '@acme/plugin', options: {} })).toBe('@acme/plugin')
    expect(pluginName(42)).toBe('')
  })
})

describe('plugin management', () => {
  it('lists enabled plugins before disabled ones', () => {
    writeConfig(configFile, { plugin: ['a', ['b', { x: 1 }]] })
    setPluginEnabled(configFile, disabledFile, 'b', false)
    expect(listPlugins(configFile, disabledFile)).toEqual([
      { name: 'a', enabled: true, spec: 'a' },
      { name: 'b', enabled: false, spec: ['b', { x: 1 }] }
    ])
  })

  it('moves a disabled plugin out of the config and keeps its original spec', () => {
    writeConfig(configFile, { plugin: ['a', ['b', { x: 1 }]] })
    setPluginEnabled(configFile, disabledFile, 'b', false)
    expect(pluginArray()).toEqual(['a'])
    expect(listPlugins(configFile, disabledFile)[1]).toEqual({
      name: 'b',
      enabled: false,
      spec: ['b', { x: 1 }]
    })
  })

  it('restores the original spec when re-enabled', () => {
    writeConfig(configFile, { plugin: ['a', ['b', { x: 1 }]] })
    setPluginEnabled(configFile, disabledFile, 'b', false)
    setPluginEnabled(configFile, disabledFile, 'b', true)
    expect(pluginArray()).toEqual(['a', ['b', { x: 1 }]])
    expect(listPlugins(configFile, disabledFile)).toEqual([
      { name: 'a', enabled: true, spec: 'a' },
      { name: 'b', enabled: true, spec: ['b', { x: 1 }] }
    ])
  })

  it('deletes a plugin from both the config and the disabled record', () => {
    writeConfig(configFile, { plugin: ['a', 'b'] })
    setPluginEnabled(configFile, disabledFile, 'b', false)
    deletePlugin(configFile, disabledFile, 'b')
    expect(pluginArray()).toEqual(['a'])
    expect(listPlugins(configFile, disabledFile)).toEqual([{ name: 'a', enabled: true, spec: 'a' }])
  })

  it('keeps other config fields untouched', () => {
    writeConfig(configFile, { model: 'a/b', plugin: ['x'] })
    setPluginEnabled(configFile, disabledFile, 'x', false)
    expect(readConfig(configFile).data).toEqual({ model: 'a/b', plugin: [] })
  })

  it('is idempotent for unknown plugin names', () => {
    writeConfig(configFile, { plugin: ['a'] })
    setPluginEnabled(configFile, disabledFile, 'missing', false)
    setPluginEnabled(configFile, disabledFile, 'missing', true)
    deletePlugin(configFile, disabledFile, 'missing')
    expect(pluginArray()).toEqual(['a'])
    expect(listPlugins(configFile, disabledFile)).toEqual([{ name: 'a', enabled: true, spec: 'a' }])
  })

  it('tolerates a missing or corrupted disabled record', () => {
    writeConfig(configFile, { plugin: ['a'] })
    expect(listPlugins(configFile, disabledFile)).toEqual([{ name: 'a', enabled: true, spec: 'a' }])
    mkdirSync(join(dir, '.occonfiger'), { recursive: true })
    writeFileSync(disabledFile, 'not json', 'utf8')
    expect(listPlugins(configFile, disabledFile)).toEqual([{ name: 'a', enabled: true, spec: 'a' }])
  })
})
