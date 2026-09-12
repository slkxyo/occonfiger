import { existsSync, readFileSync } from 'node:fs'
import { readConfig, writeConfig } from './io'
import { writeFileAtomic } from '../util/atomicWrite'

export type PluginEntry = { name: string; enabled: boolean; spec: unknown }

type DisabledRecord = { disabled: unknown[] }

export function pluginName(spec: unknown): string {
  if (typeof spec === 'string') return spec
  if (Array.isArray(spec)) return typeof spec[0] === 'string' ? spec[0] : ''
  if (typeof spec === 'object' && spec !== null) {
    const pkg = (spec as { package?: unknown }).package
    if (typeof pkg === 'string') return pkg
  }
  return ''
}

function readDisabled(file: string): unknown[] {
  if (!existsSync(file)) return []
  try {
    const raw = readFileSync(file, 'utf8')
    if (raw.trim() === '') return []
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      const disabled = (parsed as DisabledRecord).disabled
      if (Array.isArray(disabled)) return disabled
    }
    return []
  } catch {
    return []
  }
}

function writeDisabled(file: string, disabled: unknown[]): void {
  writeFileAtomic(file, `${JSON.stringify({ disabled }, null, 2)}\n`)
}

function readPluginArray(configFile: string): unknown[] {
  const data = readConfig(configFile).data
  return Array.isArray(data.plugin) ? data.plugin : []
}

function writePluginArray(configFile: string, plugins: unknown[]): void {
  const data = readConfig(configFile).data
  writeConfig(configFile, { ...data, plugin: plugins })
}

export function listPlugins(configFile: string, disabledFile: string): PluginEntry[] {
  const enabled = readPluginArray(configFile)
  const disabled = readDisabled(disabledFile)
  return [
    ...enabled.map((spec) => ({ name: pluginName(spec), enabled: true, spec })),
    ...disabled.map((spec) => ({ name: pluginName(spec), enabled: false, spec }))
  ].filter((entry) => entry.name !== '')
}

export function setPluginEnabled(
  configFile: string,
  disabledFile: string,
  name: string,
  enabled: boolean
): void {
  const plugins = readPluginArray(configFile)
  const disabled = readDisabled(disabledFile)
  if (enabled) {
    const index = disabled.findIndex((spec) => pluginName(spec) === name)
    if (index === -1) return
    const spec = disabled[index]
    writePluginArray(configFile, [...plugins, spec])
    writeDisabled(
      disabledFile,
      disabled.filter((_, i) => i !== index)
    )
    return
  }
  const index = plugins.findIndex((spec) => pluginName(spec) === name)
  if (index === -1) return
  const spec = plugins[index]
  writePluginArray(
    configFile,
    plugins.filter((_, i) => i !== index)
  )
  writeDisabled(disabledFile, [...disabled, spec])
}

export function deletePlugin(configFile: string, disabledFile: string, name: string): void {
  const plugins = readPluginArray(configFile)
  const disabled = readDisabled(disabledFile)
  writePluginArray(
    configFile,
    plugins.filter((spec) => pluginName(spec) !== name)
  )
  writeDisabled(
    disabledFile,
    disabled.filter((spec) => pluginName(spec) !== name)
  )
}
