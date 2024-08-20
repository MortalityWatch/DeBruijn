import { type Edge, type NetworkData } from './model'
const adjacencyMap = new Map<number, { from: number; to: number; id: number }[]>()

const MAX = 1000

const travelPath = (
  node: number,
  visited: Set<number>,
  currentPath: number[],
  allPaths: Set<number>[],
  pathSet: Set<string>
) => {
  if (allPaths.length > MAX) return
  const outEdges = adjacencyMap.get(node)
  if (!outEdges || outEdges.length === 0) {
    // Capture the current path when no more edges are available
    if (currentPath.length > 0) {
      const pathString = currentPath.join(',')
      if (!pathSet.has(pathString)) {
        pathSet.add(pathString)
        allPaths.push(new Set(currentPath))
      }
    }
    return
  }

  for (const edge of outEdges) {
    if (visited.has(edge.id)) continue // Skip already visited edges

    visited.add(edge.id)
    currentPath.push(edge.id)

    travelPath(edge.to, visited, currentPath, allPaths, pathSet)

    // Backtrack to explore other paths
    visited.delete(edge.id)
    currentPath.pop()
  }

  // Capture the path even when backtracking
  if (currentPath.length > 0) {
    const pathString = currentPath.join(',')
    if (!pathSet.has(pathString)) {
      pathSet.add(pathString)
      allPaths.push(new Set(currentPath))
    }
  }
}

export const dfs = (startingNode: number): Set<number>[] => {
  const allPaths: Set<number>[] = []
  const visited = new Set<number>()
  const currentPath: number[] = []
  const pathSet = new Set<string>()

  travelPath(startingNode, visited, currentPath, allPaths, pathSet)
  return allPaths
}

export const getEdgePaths = (networkData: NetworkData): Set<number>[] => {
  const { nodes, edgesData } = networkData

  nodes.forEach((node) => adjacencyMap.set(node.id, []))
  edgesData.forEach((edge) => {
    const outEdges = adjacencyMap.get(edge.from) || []
    outEdges.push({ from: edge.from, to: edge.to, id: edge.id })
    adjacencyMap.set(edge.from, outEdges)
  })

  const paths: Set<number>[] = []

  const startingNodes = nodes.filter((node) => (adjacencyMap.get(node.id) || []).length)
  startingNodes.forEach((node) => paths.push(...dfs(node.id)))

  return paths.filter((x) => x.size > 1) // Filter out single-node paths if needed
}

const collapse = (seq1: string, seq2: string, k: number): string => seq1 + seq2.substring(k - 1)

export const getContigs = (paths: Set<number>[], edgesData: Edge[], k: number): string[] => {
  const uniqueContigs = new Set<string>()

  paths.forEach((path) => {
    const edgeIds = Array.from(path)
    const contig = edgeIds.reduce((currentContig, edgeId, index) => {
      const edge = edgesData.find((e) => e.id === edgeId)
      if (edge) {
        return index === 0 ? edge.label : collapse(currentContig, edge.label, k)
      }
      return currentContig
    }, '')

    if (contig) {
      uniqueContigs.add(contig)
    }
  })

  return Array.from(uniqueContigs).sort((a, b) => b.length - a.length)
}
