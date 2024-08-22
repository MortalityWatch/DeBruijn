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
  stream: ContigStream,
  visited: Set<number>,
  currentPath: number[],
  currentContig: string,
  memo: Set<string>,
  context: {
    edgeMap: Map<number, Edge>
    adjacencyMap: Map<number, { from: number; to: number; id: number }[]>
    k: number
  }
) => {
  const outEdges = context.adjacencyMap.get(node)
  if (!outEdges || outEdges.length === 0) {
    const pathString = currentPath.join(',')
    if (!memo.has(pathString)) {
      memo.add(pathString)
      stream.emitContig(currentContig) // Emit the contig
    }
    return
  }

  for (const edge of outEdges) {
    if (visited.has(edge.id)) continue

    const nextContig =
      currentPath.length === 0
        ? context.edgeMap.get(edge.id)!.label
        : collapse(currentContig, context.edgeMap.get(edge.id)!.label, context.k)

    const pathKey = `${edge.to}-${nextContig}`
    if (memo.has(pathKey)) continue // Skip this path if it has been visited
    memo.add(pathKey) // Add this path to the memoization set

    visited.add(edge.id)
    currentPath.push(edge.id)

    travelPath(edge.to, stream, visited, currentPath, nextContig, memo, context)

    visited.delete(edge.id)
    currentPath.pop()
  }

  if (currentPath.length > 0) {
    const pathString = currentPath.join(',')
    if (!memo.has(pathString)) {
      memo.add(pathString)
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
  const context = { edgeMap, adjacencyMap, k }

  // Return the stream immediately and start processing asynchronously
  setTimeout(() => {
    adjacencyMap.forEach((_, node) => {
      travelPath(node, stream, new Set<number>(), [], '', new Set<string>(), context)
    })

    stream.end() // Signal the end of the stream once all nodes are processed
  }, 0)

  return stream
}
