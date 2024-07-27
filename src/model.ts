export type Node = {
  id: number
  label: string
}

export type Edge = {
  id: number
  from: number
  to: number
  arrows: string
  count?: number
  label?: string
}

export type NetworkData = {
  nodes: Node[]
  edges: Edge[]
}
