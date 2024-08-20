import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { Edge, NetworkData, QueryParams, RefOptions } from './model'
import { ref, watch } from 'vue'
import { type Ref } from 'vue'

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
  const edgesData: Edge[] = []

  const nodes = Array.from(graph.keys())
  const edges: Edge[] = []

  // Step 1: Precompute edge counts
  const edgeCountMap = new Map<string, number>()

  for (const node of nodes) {
    const targetsFromNode = graph.get(node)!!

    targetsFromNode.forEach((targetNode) => {
      const e = node[0] + targetNode
      const currentCount = edgeCountMap.get(e) ?? 0

      edgeCountMap.set(e, currentCount + 1)
    })
  }

  // Step 2: Build the edges array using the precomputed counts
  // Store display and actual data separately.
  const uniqueEdges = new Set<string>()
  const nodeIndexMap = new Map<string, number>()
  nodes.forEach((node, index) => nodeIndexMap.set(node, index))

  for (const node of nodes) {
    const nodeIndex = nodeIndexMap.get(node)!
    nodesData.push({ id: nodesData.length, label: node })
    const targetsFromNode = graph.get(node)!!

    for (const targetNode of targetsFromNode) {
      const targetIndex = nodeIndexMap.get(targetNode)!
      const e = node[0] + targetNode
      const totalCount = edgeCountMap.get(e)!!
      const combination = `${nodeIndex}-${targetIndex}`

      const edge = {
        id: edgesData.length,
        from: nodeIndex,
        to: targetIndex,
        arrows: 'to',
        label: e
      } as Edge

      if (!uniqueEdges.has(combination)) {
        uniqueEdges.add(combination)
        const edgeCopy = JSON.parse(JSON.stringify(edge))
        if (totalCount > 1) edgeCopy.label = `${edgeCopy.label} (${totalCount})`
        edges.push(edgeCopy)
      }
      edgesData.push(edge)
    }
  }

  return {
    nodes: nodesData,
    edges,
    edgesData
  }
}

export const shortestReadLength = (reads: string[]): number => {
  if (reads.length) return reads.reduce((p, v) => (p.length < v.length ? p : v)).length
  return 0
}

export const longestReadLength = (reads: string[]) => {
  return reads.reduce((p, v) => (p.length > v.length ? p : v)).length
}

const seededRandom = (seed: number): number => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

export const getRandomSubstrings = (
  s: string,
  readLength: number,
  count: number,
  seed: number
): string[] => {
  if (readLength > s.length) {
    throw new Error('Substring length cannot be greater than the string length')
  }

  const maxStartIndex = s.length - readLength
  const substrings: string[] = []
  let currentSeed = seed

  for (let i = 0; i < count; i++) {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296
    const startIndex = Math.floor(seededRandom(currentSeed) * (maxStartIndex + 1))
    substrings.push(s.substring(startIndex, startIndex + readLength))
  }

  return substrings
}

const shuffleString = (s: string) => {
  const array = s.split('')
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(1) * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.join('')
}

export const makeReads = (
  genome: string,
  readLength: number,
  reads: number,
  noiseReads: number,
  seed: number
) => {
  const result = []
  result.push(...getRandomSubstrings(genome, readLength, reads, seed))
  const shuffledGenome = shuffleString(genome)
  result.push(...getRandomSubstrings(shuffledGenome, readLength, noiseReads, seed))

  return result
}

export const downloadFastaFile = (reads: string[], filename: string, readname: string): void => {
  // Create the FASTA formatted content
  let fastaContent = ''
  reads.forEach((read, index) => {
    fastaContent += `>${readname}_${index + 1}\n${read}\n`
  })

  // Create a Blob from the content
  const blob = new Blob([fastaContent], { type: 'text/plain' })

  // Create a link element and trigger a download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.fa`

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

export const useQuerySync = <T extends Record<string, QueryParams>>(
  defaultValues: T
): RefOptions<T> => {
  const router = useRouter()
  const route = useRoute()

  const refs = {} as RefOptions<T>

  Object.entries(defaultValues).forEach(([key, defaultValue]) => {
    let queryValue = route.query[key as string]

    // Handle the case where queryValue is an array
    if (Array.isArray(queryValue)) {
      queryValue = queryValue[0] // Use the first value from the array
    }

    let parsedValue: QueryParams

    if (typeof queryValue === 'string') {
      if (!isNaN(Number(queryValue))) {
        parsedValue = Number(queryValue)
      } else if (queryValue === 'true' || queryValue === 'false') {
        parsedValue = queryValue === 'true'
      } else {
        parsedValue = queryValue
      }
    } else {
      parsedValue = defaultValue
    }

    refs[key as keyof T] = ref(parsedValue) as Ref<T[keyof T]>
  })

  const keys = Object.keys(refs)
  keys.forEach((key) => {
    watch(refs[key], (newVal) => {
      router.push({ query: { ...route.query, [key as string]: newVal } as LocationQueryRaw })
    })
  })
  // Watch for changes in the URL and update the refs accordingly
  watch(
    () => route.query,
    (newQuery) => {
      keys.forEach((key) => {
        let queryValue = newQuery[key as string]

        if (Array.isArray(queryValue)) {
          queryValue = queryValue[0] // Use the first value from the array
        }

        let parsedValue: QueryParams

        if (typeof queryValue === 'string') {
          if (!isNaN(Number(queryValue))) {
            parsedValue = Number(queryValue)
          } else if (queryValue === 'true' || queryValue === 'false') {
            parsedValue = queryValue === 'true'
          } else {
            parsedValue = queryValue
          }
        } else {
          parsedValue = defaultValues[key as keyof T]
        }

        refs[key as keyof T].value = parsedValue as T[keyof T]
      })
    },
    { immediate: true }
  )

  return refs
}
