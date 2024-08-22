import type { Edge } from '@/model'

export class ContigStream extends EventTarget {
  emitContig(contig: string) {
    this.dispatchEvent(new CustomEvent('data', { detail: contig }))
  }

  end() {
    this.dispatchEvent(new Event('end'))
  }
}

const collapse = (seq1: string, seq2: string, k: number): string => seq1 + seq2.substring(k - 1)

const travelPath = (
  node: number,
  visited: Set<number>,
  currentPath: number[],
  currentContig: string,
  pathSet: Set<string>,
  edgeMap: Map<number, Edge>,
  adjacencyMap: Map<number, { from: number; to: number; id: number }[]>,
  k: number,
  stream: ContigStream
) => {
  const outEdges = adjacencyMap.get(node)
  if (!outEdges || outEdges.length === 0) {
    const pathString = currentPath.join(',')
    if (!pathSet.has(pathString)) {
      pathSet.add(pathString)
      stream.emitContig(currentContig) // Emit the contig
    }
    return
  }

  for (const edge of outEdges) {
    if (visited.has(edge.id)) continue

    const nextContig =
      currentPath.length === 0
        ? edgeMap.get(edge.id)!.label
        : collapse(currentContig, edgeMap.get(edge.id)!.label, k)

    visited.add(edge.id)
    currentPath.push(edge.id)

    travelPath(edge.to, visited, currentPath, nextContig, pathSet, edgeMap, adjacencyMap, k, stream)

    visited.delete(edge.id)
    currentPath.pop()
  }

  if (currentPath.length > 0) {
    const pathString = currentPath.join(',')
    if (!pathSet.has(pathString)) {
      pathSet.add(pathString)
      stream.emitContig(currentContig) // Emit the contig during backtracking
    }
  }
}

export const getContigs = (edgesData: Edge[], k: number): ContigStream => {
  const adjacencyMap = new Map<number, { from: number; to: number; id: number }[]>()

  edgesData.forEach((edge) => {
    const outEdges = adjacencyMap.get(edge.from) || []
    outEdges.push({ from: edge.from, to: edge.to, id: edge.id })
    adjacencyMap.set(edge.from, outEdges)
  })

  const edgeMap = new Map<number, Edge>(edgesData.map((edge) => [edge.id, edge]))
  const stream = new ContigStream()

  // Return the stream immediately and start processing asynchronously
  setTimeout(() => {
    adjacencyMap.forEach((_, node) => {
      travelPath(
        node,
        new Set<number>(),
        [],
        '',
        new Set<string>(),
        edgeMap,
        adjacencyMap,
        k,
        stream
      )
    })

    stream.end() // Signal the end of the stream once all nodes are processed
  }, 0)

  return stream
}
