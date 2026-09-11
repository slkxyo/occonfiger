type Node = Record<string, unknown>

export function getAt(root: unknown, path: string[]): unknown {
  let node: unknown = root
  for (const key of path) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Node)[key]
  }
  return node
}

export function setAt(root: Node, path: string[], value: unknown): void {
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
    node = node[key] as Node
  }
  node[path[path.length - 1]] = value
}

export function deleteAt(root: Node, path: string[]): void {
  const parents: Node[] = [root]
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const next = node[path[i]]
    if (typeof next !== 'object' || next === null) return
    node = next as Node
    parents.push(node)
  }
  delete node[path[path.length - 1]]
  for (let i = parents.length - 1; i > 0; i -= 1) {
    if (Object.keys(parents[i]).length === 0) delete parents[i - 1][path[i - 1]]
    else break
  }
}
