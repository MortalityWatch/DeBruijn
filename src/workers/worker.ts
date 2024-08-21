import { getContigs } from './contig'

self.onmessage = async (event) => {
  console.log('worker: ' + event)
  const { edgesData, k } = event.data
  self.postMessage('start')
  const contigs = getContigs(edgesData, k)
  self.postMessage(contigs)
  self.postMessage('end')
}
