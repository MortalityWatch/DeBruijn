import { describe, it, expect } from 'vitest'
import { getContigs, getEdgePaths } from './contig'
import { type NetworkData } from './model'

describe('Pathfinding', () => {
  it('finds paths in a linear sequence', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' }
      ]
    } as NetworkData
    const paths = getEdgePaths(network)
    expect(paths).toEqual([new Set<number>([0, 1])])
  })

  it('finds paths with branching', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'BD' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 1, to: 3, label: 'ABD' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)

    expect(paths).toEqual([new Set<number>([0, 1]), new Set<number>([0, 2])])
  })

  it('finds multiple disjoint paths', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'CD' },
        { id: 4, label: 'DE' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 3, to: 4, label: 'CDE' }
      ]
    } as NetworkData
    const paths = getEdgePaths(network)
    expect(paths).toEqual([new Set<number>([0, 1])])
  })

  it('handles cyclic paths', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 2, to: 0, label: 'CAA' }
      ]
    } as NetworkData
    const paths = getEdgePaths(network)

    expect(paths).toEqual([
      new Set<number>([0, 1, 2]),
      new Set<number>([0, 1]),
      new Set<number>([1, 2, 0]),
      new Set<number>([1, 2]),
      new Set<number>([2, 0, 1]),
      new Set<number>([2, 0])
    ])
  })

  it('handles isolated nodes', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'CD' }, // Isolated node
        { id: 4, label: 'DE' } // Isolated node
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)
    expect(paths).toEqual([new Set<number>([0, 1])])
  })

  it('handles multiple disconnected subgraphs', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'CD' },
        { id: 4, label: 'DE' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 3, to: 4, label: 'CDE' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)
    expect(paths).toEqual([new Set<number>([0, 1])])
  })

  it('handles parallel edges between nodes', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 0, to: 1, label: 'AAC' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)
    expect(paths).toEqual([])
  })

  it('handles self-loops', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 0, label: 'AAA' }, // Self-loop
        { id: 1, from: 0, to: 1, label: 'AAB' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)
    expect(paths).toEqual([new Set<number>([0, 1])])
  })

  it('handles a graph with only one edge', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' }
      ],
      edgesData: [{ id: 0, from: 0, to: 1, label: 'AAB' }]
    } as NetworkData

    const paths = getEdgePaths(network)
    expect(paths).toEqual([])
  })

  it('handles complex cyclic graphs', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'CD' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 2, to: 0, label: 'CAA' },
        { id: 3, from: 2, to: 3, label: 'BCD' },
        { id: 4, from: 3, to: 1, label: 'CDB' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)

    expect(paths).toEqual([
      new Set<number>([0, 1, 2]),
      new Set<number>([0, 1, 3, 4]),
      new Set<number>([0, 1, 3]),
      new Set<number>([0, 1]),
      new Set<number>([1, 2, 0]),
      new Set<number>([1, 2]),
      new Set<number>([1, 3, 4]),
      new Set<number>([1, 3]),
      new Set<number>([2, 0, 1, 3, 4]),
      new Set<number>([2, 0, 1, 3]),
      new Set<number>([2, 0, 1]),
      new Set<number>([2, 0]),
      new Set<number>([3, 4, 1, 2, 0]),
      new Set<number>([3, 4, 1, 2]),
      new Set<number>([3, 4, 1]),
      new Set<number>([3, 4]),
      new Set<number>([4, 1, 2, 0]),
      new Set<number>([4, 1, 2]),
      new Set<number>([4, 1, 3]),
      new Set<number>([4, 1])
    ])
  })
})

describe('Contig generation', () => {
  it('simple contig', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 0, label: 'AAA' }, // Self-loop
        { id: 1, from: 0, to: 1, label: 'AAB' }
      ]
    } as NetworkData

    const paths: Set<number>[] = getEdgePaths(network)
    const contigs = getContigs(paths, network.edgesData, 3)

    expect(contigs).toEqual(['AAAB'])
  })

  it('contig with branching paths', () => {
    const network = {
      nodes: [
        { id: 0, label: 'AA' },
        { id: 1, label: 'AB' },
        { id: 2, label: 'BC' },
        { id: 3, label: 'BD' }
      ],
      edgesData: [
        { id: 0, from: 0, to: 1, label: 'AAB' },
        { id: 1, from: 1, to: 2, label: 'ABC' },
        { id: 2, from: 1, to: 3, label: 'ABD' }
      ]
    } as NetworkData

    const paths = getEdgePaths(network)
    const contigs = getContigs(paths, network.edgesData, 3)

    expect(contigs).toEqual(['AABC', 'AABD'])
  })
})
