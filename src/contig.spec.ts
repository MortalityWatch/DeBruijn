import { describe, it, expect } from 'vitest'
import { getContigs } from './contig'
import { type Edge } from './model'

describe('Pathfinding', () => {
  it('finds paths in a linear sequence', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' }
    ] as Edge[]
    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AABC'])
  })

  it('finds paths with branching', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 1, to: 3, label: 'ABD' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AABC', 'AABD'])
  })

  it('finds multiple disjoint paths', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 3, to: 4, label: 'CDE' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AABC'])
  })

  it('handles cyclic paths', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'ATG' },
      { id: 1, from: 1, to: 2, label: 'TGA' },
      { id: 2, from: 2, to: 0, label: 'GAT' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    console.log(paths)
    expect(paths).toEqual(['ATGAT', 'GATGA', 'TGATG', 'ATGA', 'GATG', 'TGAT'])
  })

  it('handles isolated nodes', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AABC'])
  })

  it('handles multiple disconnected subgraphs', () => {
    const data = [
      { id: 0, from: 0, to: 1, label: 'AAB' },
      { id: 1, from: 1, to: 2, label: 'ABC' },
      { id: 2, from: 3, to: 4, label: 'CDE' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AABC'])
  })

  it('handles self-loops', () => {
    const data = [
      { id: 0, from: 0, to: 0, label: 'AAA' }, // Self-loop
      { id: 1, from: 0, to: 1, label: 'AAB' }
    ] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual(['AAAB'])
  })

  it('handles a graph with only one edge', () => {
    const data = [{ id: 0, from: 0, to: 1, label: 'AAB' }] as Edge[]

    const paths = getContigs(data, 3)
    expect(paths).toEqual([])
  })
})
