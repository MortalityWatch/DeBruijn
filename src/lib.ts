import type { Edge, NetworkData } from './model'

export const readsToKmers = (k: number, reads: string[]) => {
  const kmers = []
  for (let i = 0; i < reads.length; i++) {
    for (let j = 0; j < reads[i].length - k + 1; ++j) {
      kmers.push(reads[i].substring(j, j + k))
    }
  }
  return kmers
}

export const makeGraph = (kmers: string[]) => {
  const graph = new Map<string, string[]>()

  for (let i = 0; i < kmers.length; i++) {
    const left = kmers[i].substring(0, kmers[i].length - 1)
    const right = kmers[i].substring(1, kmers[i].length)

    if (graph.has(left)) graph.get(left)!!.push(right)
    else graph.set(left, [right])

    if (!graph.has(right)) graph.set(right, [])
  }

  return graph
}

export const toNetworkData = (graph: Map<string, string[]>): NetworkData => {
  const nodesData = []
  const edgesData = []

  const keys = graph.keys()
  const edges = new Map<string, Edge>()

  const keyArr = Array.from(keys)
  for (const key of keyArr) {
    nodesData.push({ id: nodesData.length, label: key })
    graph.get(key)!!.forEach((item) => {
      const e = key[0] + item
      if (edges.has(e)) {
        const edge = edges.get(e)!!
        edge.count = edge.count!! + 1
        edge.label = e
      } else {
        edges.set(e, {
          from: keyArr.indexOf(key),
          to: keyArr.indexOf(item),
          count: 1,
          label: e
        } as Edge)
      }
    })
  }

  let i = 0
  for (const value of edges.values()) {
    edgesData.push({
      id: i++,
      from: value.from,
      to: value.to,
      arrows: 'to',
      label: `${value.label}${value.count === 1 ? '' : ` (${value.count})`}`
    })
  }
  return {
    nodes: nodesData,
    edges: edgesData
  }
}

export const shortestReadLength = (reads: string[]): number => {
  if (reads.length) return reads.reduce((p, v) => (p.length < v.length ? p : v)).length
  return 0
}

export const longestReadLength = (reads: string[]) => {
  return reads.reduce((p, v) => (p.length > v.length ? p : v)).length
}

export const getContigs = (networkData: NetworkData): string[] => {
  const { nodes, edges } = networkData

  // Create a map of node IDs to their outgoing edges
  const adjacencyMap = new Map<number, { to: number; id: number }[]>()
  nodes.forEach((node) => adjacencyMap.set(node.id, []))
  edges.forEach((edge) => {
    const outEdges = adjacencyMap.get(edge.from) || []
    outEdges.push({ to: edge.to, id: edge.id })
    adjacencyMap.set(edge.from, outEdges)
  })

  // Find all contigs starting from each starting node
  const contigs: number[][] = []

  const extendPath = (node: number, path: number[], visitedEdges: Set<number>) => {
    path.push(node)

    const outEdges = adjacencyMap.get(node)
    if (outEdges?.length === 0) {
      if (path.length > 1) contigs.push(path)
      return
    }

    outEdges?.forEach((edge) => {
      if (path.length > 1) contigs.push(path)
      if (visitedEdges.has(edge.id)) {
        return
      } else {
        const targetNode = edge.to
        visitedEdges.add(edge.id)
        extendPath(targetNode, path.slice(), new Set(visitedEdges))
      }
    })
  }

  // Find all nodes with outgoing edges and generate contigs
  const startingNodes = nodes.filter((node) => (adjacencyMap.get(node.id) || []).length)
  startingNodes.forEach((node) => {
    if (!(adjacencyMap.get(node.id) || []).length) return
    extendPath(node.id, [], new Set())
  })

  // Convert contigs of node IDs to contigs of node labels
  const nodeMap = new Map<number, string>()
  nodes.forEach((node) => nodeMap.set(node.id, node.label))

  const contigsArr = Array.from(contigs)
  const contigLabels = new Set<string>()
  contigsArr.forEach((contig: number[]) => {
    if (contig.length < 3) return

    const result: string[] = []
    for (let i = 0; i < contig.length; i++) {
      const kmer = nodeMap.get(contig[i])!!
      if (i === 0) {
        result.push(kmer) // First kmer
      } else {
        result.push(kmer.slice(-1))
      }
    }
    contigLabels.add(result.join(''))
  })
  return Array.from(contigLabels).sort((a, b) => b.length - a.length)
}

const splitStringRandomly = (s: string, n: number): string[] => {
  if (n <= 0 || n > s.length) {
    throw new Error('Number of pieces must be between 1 and the length of the string')
  }

  // Generate n-1 random split points
  const splitPoints = Array.from(
    new Set(Array.from({ length: n - 1 }, () => Math.floor(Math.random() * (s.length - 1)) + 1))
  ).sort((a, b) => a - b)

  // Add the start and end points
  splitPoints.unshift(0)
  splitPoints.push(s.length)

  // Create the list of pieces by splitting the string at the split points
  const pieces: string[] = []
  for (let i = 0; i < splitPoints.length - 1; i++) {
    pieces.push(s.slice(splitPoints[i], splitPoints[i + 1]))
  }

  return pieces
}

const shuffleString = (s: string) => {
  const array = s.split('')
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.join('')
}

export const makeReads = (genome: string, n: number, minReadLength: number, noiseReads: number) => {
  const result = []
  while (result.length < n) {
    result.push(...splitStringRandomly(genome, 2).filter((x) => x.length >= minReadLength))
  }
  while (result.length - n < noiseReads) {
    result.push(
      ...splitStringRandomly(shuffleString(genome), 2).filter((x) => x.length >= minReadLength)
    )
  }
  return result
}

export const downloadFastaFile = (reads: string[], filename: string): void => {
  // Create the FASTA formatted content
  let fastaContent = ''
  reads.forEach((read, index) => {
    fastaContent += `>Read_${index + 1}\n${read}\n`
  })

  // Create a Blob from the content
  const blob = new Blob([fastaContent], { type: 'text/plain' })

  // Create a link element and trigger a download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename

  // Append the link to the document body and trigger a click
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
}

export const hashCode = (str: string) => {
  let hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const timeoutIds: Record<number, number | undefined> = {}
export const delay = (fun: () => void, time: number = 333) => {
  const hash = hashCode(fun.toString())
  if (timeoutIds[hash]) clearTimeout(timeoutIds[hash])
  timeoutIds[hash] = setTimeout(async () => {
    fun()
    timeoutIds[hashCode(fun.toString())] = undefined
  }, time) as unknown as number
}

export const generateRandomDNAString = (length: number): string => {
  const characters = 'ACTG'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
