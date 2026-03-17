import type { AudioComponent, BackendNode } from '@score/core'

// Tracks disposal to catch memory leaks
export const createMockComponent = (): AudioComponent & { disposed: boolean; connectedNodes: BackendNode[] } => {
  const comp = {
    id: `mock-${Math.random().toString(36).slice(2)}`,
    type: 'mock',
    disposed: false,
    connectedNodes: [] as BackendNode[],
    connect(dest: BackendNode): AudioComponent { comp.connectedNodes.push(dest); return comp },
    disconnect(): AudioComponent { comp.connectedNodes.length = 0; return comp },
    dispose(): void { comp.disposed = true; comp.connectedNodes.length = 0 },
  }
  return comp
}
