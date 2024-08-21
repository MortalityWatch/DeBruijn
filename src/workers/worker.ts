import { getContigs } from './contig'

self.onmessage = async (event) => {
  console.log('worker: ' + event)
  const { edgesData, k } = event.data
  self.postMessage('start')
  getContigs(edgesData, k, self)
  self.postMessage('end')
}
