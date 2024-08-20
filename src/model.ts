import type { Ref } from 'vue'

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
  label: string
}

export type NetworkData = {
  nodes: Node[]
  edges: Edge[]
  edgesData: Edge[]
}

export type QueryParams = string | number | boolean

export type RefOptions<T extends Record<string, QueryParams>> = {
  [K in keyof T]: Ref<T[K]>
}
