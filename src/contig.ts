import { type Edge } from './model'

// Utility function to collapse overlapping sequences
const collapse = (seq1: string, seq2: string, k: number): string => seq1 + seq2.substring(k - 1)

const travelPath = (
  node: number,
  visited: Set<number>,
  currentPath: number[],
  currentContig: string,
  allPaths: Set<number>[],
  pathSet: Set<string>,
  contigs: Set<string>,
  edgeMap: Map<number, Edge>,
  adjacencyMap: Map<number, { from: number; to: number; id: number }[]>,
  k: number
) => {
  const outEdges = adjacencyMap.get(node)
  if (!outEdges || outEdges.length === 0) {
    // Capture the current path and contig when no more edges are available
    if (currentPath.length > 0) {
      const pathString = currentPath.join(',')
      if (!pathSet.has(pathString)) {
        pathSet.add(pathString)
        allPaths.push(new Set(currentPath))
        contigs.add(currentContig)
      }
    }
    return
  }

  for (const edge of outEdges) {
    if (visited.has(edge.id)) continue // Skip already visited edges

    const nextContig = edgeMap.has(edge.id)
      ? currentPath.length === 0
        ? edgeMap.get(edge.id)!.label
        : collapse(currentContig, edgeMap.get(edge.id)!.label, k)
      : currentContig

    visited.add(edge.id)
    currentPath.push(edge.id)

    travelPath(
      edge.to,
      visited,
      currentPath,
      nextContig,
      allPaths,
      pathSet,
      contigs,
      edgeMap,
      adjacencyMap,
      k
    )

    // Backtrack to explore other paths
    visited.delete(edge.id)
    currentPath.pop()
  }

  // Capture the path and contig even when backtracking
  if (currentPath.length > 0) {
    const pathString = currentPath.join(',')
    if (!pathSet.has(pathString)) {
      pathSet.add(pathString)
      allPaths.push(new Set(currentPath))
      contigs.add(currentContig)
    }
  }
}

export const dfs = (
  startingNode: number,
  edgeMap: Map<number, Edge>,
  adjacencyMap: Map<number, { from: number; to: number; id: number }[]>,
  k: number
): { paths: Set<number>[]; contigs: Set<string> } => {
  const allPaths: Set<number>[] = []
  const contigs = new Set<string>()
  const visited = new Set<number>()
  const currentPath: number[] = []
  const pathSet = new Set<string>()

  travelPath(
    startingNode,
    visited,
    currentPath,
    '',
    allPaths,
    pathSet,
    contigs,
    edgeMap,
    adjacencyMap,
    k
  )
  return { paths: allPaths, contigs }
}

export const getContigs = (edgesData: Edge[], k: number): string[] => {
  // Reset adjacency map for each function call
  const adjacencyMap = new Map<number, { from: number; to: number; id: number }[]>()

  // Build adjacency map
  edgesData.forEach((edge) => {
    const outEdges = adjacencyMap.get(edge.from) || []
    outEdges.push({ from: edge.from, to: edge.to, id: edge.id })
    adjacencyMap.set(edge.from, outEdges)
  })

  const edgeMap = new Map<number, Edge>(edgesData.map((edge) => [edge.id, edge]))
  const allPaths: Set<number>[] = []
  const allContigs = new Set<string>()

  // Traverse from each node that has outgoing edges
  const startingNodes = Array.from(adjacencyMap.keys())
  startingNodes.forEach((node) => {
    const { paths, contigs } = dfs(node, edgeMap, adjacencyMap, k)
    paths.forEach((path) => allPaths.push(path))
    contigs.forEach((contig) => allContigs.add(contig))
  })

  // Filter contigs to exclude those shorter than the k-mer length
  return Array.from(allContigs)
    .filter((x) => x.length > k)
    .sort((a, b) => b.length - a.length)
}
