import type { HookEvent } from '~/types'
import type { GroupingPreferences, EventGroup, GroupedEvent, GroupMeta, GroupingCriteria } from '~/types/grouping'

// Stable group tracking
const groupIdCounter = ref(0)
const groupIdMap = new Map<string, string>() // groupKey -> stable ID
const groupStateMap = new Map<string, { count: number, lastUpdate: number }>() // track changes

// Get or create stable ID for a group
const getStableGroupId = (groupKey: string): string => {
  if (!groupIdMap.has(groupKey)) {
    groupIdCounter.value++
    groupIdMap.set(groupKey, `group-${groupIdCounter.value}`)
  }
  return groupIdMap.get(groupKey)!
}

export function useEventGrouping(
  events: Ref<HookEvent[]>, 
  preferences: Ref<GroupingPreferences>
) {
  // Generate a unique key for grouping similar events
  const generateGroupKey = (event: HookEvent, prefs: GroupingPreferences): string => {
    const keyParts: string[] = []
    
    if (prefs.groupBySession) {
      keyParts.push(event.session_id)
    }
    
    keyParts.push(event.source_app)
    
    if (prefs.groupByEventType) {
      keyParts.push(event.hook_event_type)
    }
    
    if (prefs.groupByTool) {
      const toolName = (event.payload as any)?.tool_name || ''
      if (toolName) {
        keyParts.push(toolName)
      }
    }
    
    return keyParts.join('|')
  }

  // Extract a chip/summary for display from an event
  const extractChip = (event: HookEvent): string | null => {
    const payload = event.payload as any
    
    // For file operations, show filename
    const filePath = payload?.tool_input?.file_path
    if (filePath) {
      return String(filePath).split('/').pop() || filePath
    }
    
    // For bash commands, show truncated command
    const command = payload?.tool_input?.command
    if (command) {
      return String(command).slice(0, 40) + (command.length > 40 ? '...' : '')
    }
    
    // For other operations, try to extract from summary
    if (event.summary) {
      // Handle "Read file.txt" format
      const readMatch = event.summary.match(/^read\s+(.+)$/i)
      if (readMatch) {
        return readMatch[1].trim()
      }
      
      // Handle "Write to file.txt" format  
      const writeMatch = event.summary.match(/^write\s+(?:to\s+)?(.+)$/i)
      if (writeMatch) {
        return writeMatch[1].trim()
      }
      
      // Default to truncated summary
      return event.summary.slice(0, 40) + (event.summary.length > 40 ? '...' : '')
    }
    
    return null
  }

  // Generate a readable summary for a group
  const generateGroupSummary = (group: EventGroup): string => {
    const { criteria, count, events } = group
    const toolName = criteria.toolName
    
    if (toolName) {
      switch (toolName.toLowerCase()) {
        case 'read':
          const fileCount = events.filter(e => extractChip(e)?.includes('.')).length
          return fileCount > 0 
            ? `Read ${fileCount} file${fileCount === 1 ? '' : 's'}`
            : `${toolName} operations`
        case 'write':
          return `Write operations`
        case 'edit':
        case 'multiedit':
          return `Edit operations`
        case 'bash':
          return `Command executions`
        case 'task':
          return `Agent tasks`
        default:
          return `${toolName} operations`
      }
    }
    
    return `${criteria.eventType} operations`
  }

  // Group events using sliding window algorithm
  const groupedEvents = computed<(HookEvent | GroupedEvent)[]>(() => {
    const prefs = preferences.value
    
    if (!prefs.enabled) {
      return [...events.value]
    }
    
    const result: (HookEvent | GroupedEvent)[] = []
    const activeGroups = new Map<string, EventGroup>()
    
    // Sort events by timestamp for proper grouping
    const sortedEvents = [...events.value].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    
    for (const event of sortedEvents) {
      const groupKey = generateGroupKey(event, prefs)
      const timestamp = event.timestamp || 0
      const existing = activeGroups.get(groupKey)
      
      if (existing && 
          timestamp - existing.endTime <= prefs.timeWindow &&
          existing.count < prefs.maxGroupSize) {
        // Add to existing group
        existing.events.push(event)
        existing.endTime = timestamp
        existing.lastUpdated = timestamp
        existing.count++
        
        // Track state changes for animation purposes
        const previousState = groupStateMap.get(existing.id) || { count: 0, lastUpdate: 0 }
        groupStateMap.set(existing.id, { 
          count: existing.count, 
          lastUpdate: timestamp 
        })
        
        const chip = extractChip(event)
        if (chip && !existing.chips.includes(chip)) {
          existing.chips.push(chip)
        }
      } else {
        // Finalize existing group if it meets minimum size
        if (existing && existing.count >= prefs.minEventsToGroup) {
          result.push(createGroupedEvent(existing))
        } else if (existing) {
          // Add individual events if group too small
          result.push(...existing.events)
        }
        
        // Start new group
        const chip = extractChip(event)
        const stableId = getStableGroupId(groupKey)
        const newGroup: EventGroup = {
          id: stableId,
          criteria: {
            sessionId: event.session_id,
            sourceApp: event.source_app,
            eventType: event.hook_event_type,
            toolName: (event.payload as any)?.tool_name
          },
          events: [event],
          startTime: timestamp,
          endTime: timestamp,
          lastUpdated: timestamp,
          count: 1,
          chips: chip ? [chip] : []
        }
        
        // Initialize state tracking
        groupStateMap.set(stableId, { 
          count: 1, 
          lastUpdate: timestamp 
        })
        
        activeGroups.set(groupKey, newGroup)
      }
    }
    
    // Finalize remaining groups
    for (const group of activeGroups.values()) {
      if (group.count >= prefs.minEventsToGroup) {
        result.push(createGroupedEvent(group))
      } else {
        result.push(...group.events)
      }
    }
    
    // Sort result by timestamp (newest first for display)
    return result.sort((a, b) => {
      const aTime = 'groupMeta' in a ? a.groupMeta.timeRange[1] : (a.timestamp || 0)
      const bTime = 'groupMeta' in b ? b.groupMeta.timeRange[1] : (b.timestamp || 0)
      return bTime - aTime
    })
  })

  // Create a grouped event from an event group
  const createGroupedEvent = (group: EventGroup): GroupedEvent => {
    const baseEvent = group.events[0]
    
    const groupMeta: GroupMeta = {
      group: 'aggregate',
      count: group.count,
      timeRange: [group.startTime, group.endTime],
      key: group.id,
      tool: group.criteria.toolName,
      chips: [...new Set(group.chips)], // Remove duplicates
      children: [...group.events],
      summary: generateGroupSummary(group)
    }

    return {
      ...baseEvent,
      isGroup: true,
      groupMeta,
      // Update timestamp to reflect the group's end time for proper sorting
      timestamp: group.endTime
    }
  }

  // Statistics for debugging and UI display
  const groupingStats = computed(() => {
    const totalEvents = events.value.length
    const processedEvents = groupedEvents.value.length
    const groupedCount = groupedEvents.value.filter(e => 'groupMeta' in e).length
    const reduction = totalEvents > 0 ? Math.round((1 - processedEvents / totalEvents) * 100) : 0
    
    return {
      totalEvents,
      processedEvents,
      groupedCount,
      individualCount: processedEvents - groupedCount,
      reductionPercentage: reduction,
      averageGroupSize: groupedCount > 0 
        ? Math.round(groupedEvents.value
            .filter(e => 'groupMeta' in e)
            .reduce((sum, e) => sum + (e as GroupedEvent).groupMeta.count, 0) / groupedCount)
        : 0
    }
  })

  // Detect what changed about a group
  const getGroupChangeType = (groupId: string): 'new' | 'updated' | 'unchanged' => {
    if (!groupStateMap.has(groupId)) {
      return 'new'
    }
    
    const state = groupStateMap.get(groupId)!
    const timeSinceLastUpdate = Date.now() - state.lastUpdate
    
    // If updated in the last 2 seconds, consider it "updated"
    if (timeSinceLastUpdate < 2000) {
      return 'updated'  
    }
    
    return 'unchanged'
  }

  return {
    groupedEvents,
    groupingStats,
    getGroupChangeType
  }
}