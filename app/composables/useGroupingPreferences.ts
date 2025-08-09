import type { GroupingPreferences, SwimlanePreferences } from '~/types/grouping'

const STORAGE_KEY_GROUPING = 'claude-monitor-grouping-preferences'
const STORAGE_KEY_SWIMLANES = 'claude-monitor-swimlane-preferences'

const defaultGroupingPreferences: GroupingPreferences = {
  enabled: true,
  timeWindow: 10000, // 10 seconds default
  minEventsToGroup: 2,
  groupByTool: true,
  groupBySession: true,
  groupByEventType: true,
  maxGroupSize: 20
}

const defaultSwimlanePreferences: SwimlanePreferences = {
  enabled: false,
  showEmptyLanes: true,
  laneOrder: [],
  pinnedLanes: [],
  collapsedLanes: []
}

export function useGroupingPreferences() {
  // Load from localStorage
  const loadGroupingPreferences = (): GroupingPreferences => {
    if (process.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_GROUPING)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...defaultGroupingPreferences, ...parsed }
        }
      } catch (error) {
        console.warn('Failed to load grouping preferences:', error)
      }
    }
    return { ...defaultGroupingPreferences }
  }

  const loadSwimlanePreferences = (): SwimlanePreferences => {
    if (process.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SWIMLANES)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...defaultSwimlanePreferences, ...parsed }
        }
      } catch (error) {
        console.warn('Failed to load swimlane preferences:', error)
      }
    }
    return { ...defaultSwimlanePreferences }
  }

  const groupingPreferences = ref<GroupingPreferences>(loadGroupingPreferences())
  const swimlanePreferences = ref<SwimlanePreferences>(loadSwimlanePreferences())

  // Save to localStorage when preferences change
  watch(groupingPreferences, (newPrefs) => {
    if (process.client) {
      try {
        localStorage.setItem(STORAGE_KEY_GROUPING, JSON.stringify(newPrefs))
      } catch (error) {
        console.error('Failed to save grouping preferences:', error)
      }
    }
  }, { deep: true })

  watch(swimlanePreferences, (newPrefs) => {
    if (process.client) {
      try {
        localStorage.setItem(STORAGE_KEY_SWIMLANES, JSON.stringify(newPrefs))
      } catch (error) {
        console.error('Failed to save swimlane preferences:', error)
      }
    }
  }, { deep: true })

  // Helper methods
  const setGroupingEnabled = (enabled: boolean) => {
    groupingPreferences.value.enabled = enabled
  }

  const setTimeWindow = (milliseconds: number) => {
    groupingPreferences.value.timeWindow = Math.max(1000, Math.min(15000, milliseconds))
  }

  const setSwimlaneEnabled = (enabled: boolean) => {
    swimlanePreferences.value.enabled = enabled
  }

  const toggleLaneCollapsed = (sourceApp: string) => {
    const index = swimlanePreferences.value.collapsedLanes.indexOf(sourceApp)
    if (index === -1) {
      swimlanePreferences.value.collapsedLanes.push(sourceApp)
    } else {
      swimlanePreferences.value.collapsedLanes.splice(index, 1)
    }
  }

  const toggleLanePinned = (sourceApp: string) => {
    const index = swimlanePreferences.value.pinnedLanes.indexOf(sourceApp)
    if (index === -1) {
      swimlanePreferences.value.pinnedLanes.push(sourceApp)
    } else {
      swimlanePreferences.value.pinnedLanes.splice(index, 1)
    }
  }

  const updateLaneOrder = (newOrder: string[]) => {
    swimlanePreferences.value.laneOrder = [...newOrder]
  }

  // Preset configurations
  const applyPreset = (preset: 'aggressive' | 'normal' | 'minimal') => {
    switch (preset) {
      case 'aggressive':
        groupingPreferences.value = {
          ...groupingPreferences.value,
          enabled: true,
          timeWindow: 15000,
          minEventsToGroup: 2,
          maxGroupSize: 50
        }
        break
      case 'normal':
        groupingPreferences.value = {
          ...groupingPreferences.value,
          enabled: true,
          timeWindow: 10000,
          minEventsToGroup: 2,
          maxGroupSize: 20
        }
        break
      case 'minimal':
        groupingPreferences.value = {
          ...groupingPreferences.value,
          enabled: true,
          timeWindow: 5000,
          minEventsToGroup: 3,
          maxGroupSize: 10
        }
        break
    }
  }

  const resetToDefaults = () => {
    groupingPreferences.value = { ...defaultGroupingPreferences }
    swimlanePreferences.value = { ...defaultSwimlanePreferences }
  }

  return {
    groupingPreferences,
    swimlanePreferences,
    setGroupingEnabled,
    setTimeWindow,
    setSwimlaneEnabled,
    toggleLaneCollapsed,
    toggleLanePinned,
    updateLaneOrder,
    applyPreset,
    resetToDefaults
  }
}