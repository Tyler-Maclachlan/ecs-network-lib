export type TestNode = { id: number };
export type TestEdge = { from: number; to: number };

export function generateScaleFreeGraph(nodeCount: number): {
  nodes: TestNode[];
  edges: TestEdge[];
} {
  const nodes: TestNode[] = [];
  const edges: TestEdge[] = [];
  const connectionCount: number[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({ id: i });
    connectionCount[i] = 0;

    if (i === 1) {
      edges.push({ from: i, to: 0 });
      connectionCount[i]++;
      connectionCount[0]++;
    } else if (i > 1) {
      const conn = edges.length * 2;
      const rand = Math.floor(Math.random() * conn);
      let cum = 0;
      let j = 0;
      while (j < connectionCount.length && cum < rand) {
        cum += connectionCount[j];
        j++;
      }

      if (j >= i) j = Math.max(0, i - 1); // fallback if out of bounds
      edges.push({ from: i, to: j });
      connectionCount[i]++;
      connectionCount[j]++;
    }
  }

  return { nodes, edges };
}
