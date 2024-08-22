import { describe, it, expect } from 'vitest'
import { ContigStream, getContigs } from './contig'
import { type Edge } from '../model'

const collectContigsFromStream = (
  stream: ContigStream,
  callback: (contigs: string[]) => void
): void => {
  const contigs: string[] = []

  stream.addEventListener('data', (event: Event) => {
    const contig = (event as CustomEvent<string>).detail
    contigs.push(contig)
  })

  stream.addEventListener('end', () => {
    callback(contigs)
  })
}

describe('Pathfinding', () => {
  it('finds paths in a linear sequence', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AABC', 'AAB', 'ABC'])
    })
  })

  it('finds paths with branching', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 1, to: 3, label: 'ABD' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AABC', 'AABD', 'AAB', 'ABC', 'ABD'])
    })
  })

  it('finds multiple disjoint paths', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 3, to: 4, label: 'CDE' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AABC', 'AAB', 'ABC', 'CDE'])
    })
  })

  it('handles cyclic paths', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'ATG' },
      { id: 1, from: 1, to: 2, label: 'TGA' },
      { id: 2, from: 2, to: 0, label: 'GAT' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual([
        'ATGAT',
        'ATGA',
        'ATG',
        'TGATG',
        'TGAT',
        'TGA',
        'GATGA',
        'GATG',
        'GAT'
      ])
    })
  })

  it('handles isolated nodes', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AABC', 'AAB', 'ABC'])
    })
  })

  it('handles multiple disconnected subgraphs', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 3, to: 4, label: 'CDE' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AABC', 'AAB', 'ABC', 'CDE'])
    })
  })

  it('handles self-loops', () => {
    const data = [
      { id: 0, from: 0, to: 0, label: 'AAA' }, // Self-loop
      { id: 1, from: 0, to: 1, label: 'AAB' }
    ] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AAAB', 'AAA', 'AAB'])
    })
  })

  it('handles a graph with only one edge', () => {
    const data = [{ id: 0, from: 0, to: 1, label: 'AAB' }] as Edge[]
    const stream = getContigs(data, 3)

    collectContigsFromStream(stream, (contigs) => {
      expect(contigs).toEqual(['AAB'])
    })
  })
})
