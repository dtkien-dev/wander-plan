import { useWorkspaceContext } from '../providers/WorkspaceProvider'

export function useWorkspace() {
  const { workspace, trips } = useWorkspaceContext()
  return { ...workspace, isLoading: trips.isLoading || (Boolean(trips.data?.length) && workspace.isLoading), isError: trips.isError || workspace.isError, error: trips.error ?? workspace.error,
    refetch: async () => { await trips.refetch(); return workspace.refetch() } }
}

export function useTripPeople(tripId?: string) {
  const { workspace } = useWorkspaceContext()
  return {
    data: workspace.data?.trip.id === tripId ? workspace.data?.people : undefined,
    isLoading: workspace.isLoading,
    isError: workspace.isError,
    refetch: workspace.refetch,
  }
}
