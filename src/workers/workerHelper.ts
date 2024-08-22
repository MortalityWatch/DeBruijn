import { makeGraph, toNetworkData } from '@/lib'
import type { Edge, NetworkData } from '@/model'
import { unref, type Ref } from 'vue'

export const parseInput = (
  k: number,
  kmers: string[],
  network: Ref<NetworkData>,
  contigs: Ref<string[]>,
  isCalculating: Ref<boolean>
) => {
  console.log('Making graph...')
  const graph = makeGraph(kmers)
  console.log('Making network...')
  network.value = toNetworkData(graph)
  console.log('Calculating contigs...')
  isCalculating.value = true
  updateContigs(JSON.parse(JSON.stringify(unref(network.value.edgesData))), k, contigs).finally(
    () => {
      isCalculating.value = false
      console.log('Done')
    }
  )
}

let contigWorker: Worker | undefined = undefined
export const updateContigs = (edgesData: Edge[], k: number, contigs: Ref<string[]>) =>
  new Promise<void>((resolve) => {
    restartWorker()
    contigWorker?.postMessage({ edgesData: edgesData, k })

    contigWorker!!.onmessage = (event: MessageEvent) => {
      if (event.data === 'start') {
        contigs.value = []
      } else if (event.data === 'end') {
        return resolve()
      } else {
        const allContigs = new Set([...contigs.value, ...JSON.parse(event.data)])
        contigs.value = Array.from(allContigs)
          .filter((x) => x.length > k)
          .sort((a, b) => b.length - a.length)
      }
    }
  })

const restartWorker = () => {
  console.log('(Re-)starting worker...')
  contigWorker?.terminate()
  contigWorker = new Worker(new URL('../workers/worker.ts', import.meta.url), {
    type: 'module'
  })
}
