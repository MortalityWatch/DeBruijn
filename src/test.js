import { DataSet } from 'vis-data'

// Create nodes and edges
const nodes = new DataSet([
  { id: 'A', label: 'A' },
  { id: 'B', label: 'B' },
  { id: 'C', label: 'C' },
  { id: 'D', label: 'D' },
  { id: 'E', label: 'E' }
])

const edges = new DataSet([
  { from: 'A', to: 'B' },
  { from: 'A', to: 'B' }, // Multiple edge
  { from: 'B', to: 'C' },
  { from: 'C', to: 'A' }, // Creates a loop
  { from: 'A', to: 'D' },
  { from: 'D', to: 'E' }
])

// Function to find all contigs
const findAllContigs = (nodes, edges) => {
  const adjList = {}
  nodes.forEach((node) => (adjList[node.id] = []))
  edges.forEach((edge) => adjList[edge.from].push({ to: edge.to, id: edge.id }))

  const contigs = new Set()

  // Recursive function to extend path
  const extendPath = (node, path, visitedEdges) => {
    path.push(node)

    const outEdges = adjList[node]
    if (outEdges.length === 0) return

    outEdges.forEach((edge) => {
      if (path.length > 1) contigs.add(path.join(''))
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
  nodes.forEach((node) => {
    if (!adjList[node.id].length) return
    extendPath(node.id, [], new Set())
  })

  return Array.from(contigs).sort((a, b) => b.length - a.length)
}

// Find and print all contigs
const contigs = findAllContigs(nodes.get(), edges.get())
console.log(contigs) // Output the contigs found, including cycles
