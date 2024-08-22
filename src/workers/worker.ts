import { getContigs } from './contig'

const contigs = new Set<string>()
let lastIndex = 0 // Index to track the last sent contigs

const flushBuffer = () => {
  console.log('flush')
  const contigsArray = Array.from(contigs)

  if (lastIndex < contigsArray.length) {
    const newContigs = contigsArray.slice(lastIndex)
    self.postMessage(JSON.stringify(newContigs))
    // console.log('Flushed buffer with new contigs:', newContigs)

    lastIndex = contigsArray.length // Update the last index
  }
}

self.onmessage = async (event) => {
  const { edgesData, k } = event.data
  self.postMessage('start')

  const contigStream = getContigs(edgesData, k)

  contigStream.addEventListener('data', (event: Event) => {
    const contig = (event as CustomEvent<string>).detail
    contigs.add(contig)

    // Flush the buffer every 100 contigs
    if (contigs.size % 100 === 0) {
      flushBuffer()
    }
  })

  contigStream.addEventListener('end', () => {
    flushBuffer() // Ensure remaining new contigs are flushed when the stream ends
    self.postMessage('end')
  })
}
