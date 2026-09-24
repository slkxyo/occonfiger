import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from 'cn'
import { Autocomplete } from '../fields/Autocomplete'
import { Field } from '../fields/Field'
import { useConfigStore } from '../store/configStore'
import { enterStyle } from './motion'

type Rule = { action: string; resource: string; effect: 'allow' | 'ask' | 'deny' }

const EFFECTS = ['allow', 'ask', 'deny'] as const

// 权限效果元数据：中文标签 + 圆点色 + 文字色（绿=允许、琥珀=询问、红=拒绝）
const EFFECT_META: Record<Rule['effect'], { label: string; dot: string; text: string }> = {
  allow: {
    label: '允许',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  ask: {
    label: '询问',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400'
  },
  deny: {
    label: '拒绝',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400'
  }
}

function EffectSelect(props: {
  value: Rule['effect']
  onChange: (v: Rule['effect']) => void
  ariaLabel: string
}): React.JSX.Element {
  const meta = EFFECT_META[props.value] ?? EFFECT_META.ask
  return (
    <Select
      value={props.value}
      onValueChange={(v) => props.onChange(typeof v === 'string' ? (v as Rule['effect']) : 'ask')}
    >
      <SelectTrigger aria-label={props.ariaLabel} className={cn('w-full font-medium', meta.text)}>
        <span className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden="true" />
          <span>{meta.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {EFFECTS.map((eff) => {
          const m = EFFECT_META[eff]
          return (
            <SelectItem key={eff} value={eff}>
              <span className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full', m.dot)} aria-hidden="true" />
                <span className={cn('font-medium', m.text)}>{m.label}</span>
                <span className="text-xs text-muted-foreground">{eff}</span>
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

const ACTION_SUGGESTIONS = [
  '*',
  'read',
  'edit',
  'write',
  'apply_patch',
  'glob',
  'grep',
  'list',
  'shell',
  'subagent',
  'todowrite',
  'webfetch',
  'websearch',
  'skill',
  'lsp',
  'question',
  'external_directory'
]

function asRules(value: unknown): Rule[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const obj = (typeof item === 'object' && item !== null ? item : {}) as Partial<Rule>
    return {
      action: typeof obj.action === 'string' ? obj.action : '',
      resource: typeof obj.resource === 'string' ? obj.resource : '*',
      effect: obj.effect === 'allow' || obj.effect === 'deny' ? obj.effect : 'ask'
    }
  })
}

export function PermissionRulesEditor(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const rules = asRules(draft.permissions)

  const commit = (next: Rule[]): void => setField(['permissions'], next, { immediate: true })

  const update = (index: number, patch: Partial<Rule>): void => {
    const next = rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    commit(next)
  }

  const remove = (index: number): void => commit(rules.filter((_, i) => i !== index))

  const move = (index: number, delta: number): void => {
    const target = index + delta
    if (target < 0 || target >= rules.length) return
    const next = [...rules]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    commit(next)
  }

  return (
    <Field label="权限规则" description="按顺序匹配，最后一条匹配的规则生效。action 支持通配 *。">
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">未配置权限规则</p>
      ) : (
        <div className="mb-2 flex flex-col gap-2">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="oc-enter rounded-xl border border-border bg-background p-2.5"
              style={enterStyle(index)}
            >
              <div className="flex items-start gap-2">
                <div className="w-[140px] shrink-0">
                  <Autocomplete
                    ariaLabel={`权限动作 ${index}`}
                    options={ACTION_SUGGESTIONS}
                    value={rule.action}
                    placeholder="action"
                    onChange={(v) => update(index, { action: v })}
                  />
                </div>
                <Input
                  aria-label={`资源 ${index}`}
                  className="font-mono"
                  value={rule.resource}
                  placeholder="*"
                  onChange={(e) => update(index, { resource: e.target.value })}
                />
                <div className="w-[120px] shrink-0">
                  <EffectSelect
                    ariaLabel={`效果 ${index}`}
                    value={rule.effect}
                    onChange={(v) => update(index, { effect: v })}
                  />
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    aria-label={`上移规则 ${index}`}
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    aria-label={`下移规则 ${index}`}
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === rules.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    aria-label={`删除规则 ${index}`}
                    size="icon-sm"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => commit([...rules, { action: '', resource: '*', effect: 'ask' }])}
      >
        <Plus size={14} />
        添加规则
      </Button>
    </Field>
  )
}
