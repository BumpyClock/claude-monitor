<template>
  <div class="flex-1 flex overflow-hidden bg-[var(--theme-bg-secondary)]">
    <!-- Global Timestamp Column -->
    <TimestampColumn 
      :events="allEventsSorted" 
      :scroll-top="scrollTop"
    />
    
    <!-- Swimlane Container -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-auto py-2 sm:py-3 relative touch-pan-x"
      @scroll="handleScroll"
    >
      <div class="px-2 sm:px-4">
        <div 
          class="flex gap-3 sm:gap-6 min-h-full"
          :style="{
            minWidth: needsHorizontalScroll ? 'max-content' : '100%',
            width: needsHorizontalScroll ? 'auto' : '100%'
          }"
        >
        <!-- Project Lanes (Dynamic Width) -->
        <div
          v-for="lane in sortedLanes"
          :key="lane.sourceApp"
          class="relative flex-shrink-0 min-h-full border-r border-[var(--theme-border-primary)]/10 last:border-r-0 pr-2 sm:pr-4 last:pr-0"
          :style="{
            width: `${calculatedLaneWidth}px`,
            minWidth: isMobile ? '280px' : isTablet ? '320px' : '400px'
          }"
        >
          <!-- Lane Header -->
          <div 
            class="sticky top-0 z-20 bg-[var(--theme-bg-primary)]/95 backdrop-blur-lg border-b border-[var(--theme-border-primary)]/20 mb-3 sm:mb-4 pb-2 sm:pb-3 rounded-t-lg"
            :style="{ 
              borderTopColor: getHexColorForApp(lane.sourceApp),
              borderTopWidth: '3px'
            }"
          >
            <div class="flex items-center justify-between px-2 sm:px-3 pt-2">
              <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <!-- Collapse Toggle -->
                <Button
                  variant="ghost"
                  size="sm"
                  @click="toggleLaneCollapsed(lane.sourceApp)"
                  class="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-[var(--theme-bg-tertiary)] flex-shrink-0"
                >
                  <ChevronDown 
                    :class="[
                      'h-3 w-3 sm:h-4 sm:w-4 transition-transform text-[var(--theme-text-tertiary)]',
                      isLaneCollapsed(lane.sourceApp) && 'rotate-180'
                    ]"
                  />
                </Button>

                <!-- Project Info -->
                <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div 
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: getHexColorForApp(lane.sourceApp) }"
                  ></div>
                  <h3 class="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight truncate flex-1">
                    {{ lane.sourceApp }}
                  </h3>
                  <Badge variant="secondary" class="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                    {{ lane.eventCount }}
                  </Badge>
                  <span v-if="lane.lastActivity && !isMobile" class="text-[10px] sm:text-xs text-[var(--theme-text-tertiary)] flex-shrink-0">
                    {{ formatLastActivity(lane.lastActivity) }}
                  </span>
                </div>
              </div>

              <!-- Lane Actions -->
              <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <!-- Pin Toggle -->
                <Button
                  variant="ghost"
                  size="sm"
                  @click="toggleLanePinned(lane.sourceApp)"
                  :class="[
                    'h-5 w-5 sm:h-6 sm:w-6 p-0',
                    lane.isPinned 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]'
                  ]"
                >
                  <Pin :class="['h-2.5 w-2.5 sm:h-3 sm:w-3', lane.isPinned && 'fill-current']" />
                </Button>

                <!-- Activity Pulse -->
                <div 
                  v-if="isLaneActive(lane.sourceApp)"
                  class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"
                  title="Recent activity"
                ></div>
              </div>
            </div>
          </div>

          <!-- Lane Events -->
          <div 
            v-if="!isLaneCollapsed(lane.sourceApp)"
            class="space-y-2 sm:space-y-3 pl-4 sm:pl-6 relative flex-1 min-h-0"
          >
            <!-- Vertical Timeline Line -->
            <div class="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--theme-border-primary)]/20 via-[var(--theme-border-primary)]/10 to-transparent"></div>

            <!-- Empty State -->
            <div v-if="lane.events.length === 0" class="py-8 text-center">
              <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--theme-bg-tertiary)]/50 flex items-center justify-center">
                <Activity class="w-5 h-5 text-[var(--theme-text-quaternary)]" />
              </div>
              <p class="text-sm text-[var(--theme-text-tertiary)]">No recent activity</p>
            </div>

            <!-- Event List with Enhanced Animations -->
            <div class="space-y-2 sm:space-y-3">
              <template v-for="event in lane.events" :key="getEventKey(event)">
                <!-- Grouped Event Card with Animation -->
                <div
                  v-if="'groupMeta' in event"
                  :class="getAnimationClasses(getEventKey(event))"
                  class="relative transition-all duration-200"
                >
                  <GroupedEventCard
                    :event="event"
                    :gradient-class="getGradientForSession(event.session_id)"
                    :color-class="getColorForSession(event.session_id)"
                    :app-gradient-class="getGradientForApp(event.source_app)"
                    :app-color-class="getColorForApp(event.source_app)"
                    :app-hex-color="getHexColorForApp(event.source_app)"
                  />
                </div>
                
                <!-- Individual Event Row with Animation -->
                <div
                  v-else
                  :class="getAnimationClasses(getEventKey(event))"
                  class="relative transition-all duration-200"
                >
                  <EventRow
                    :event="event"
                    :gradient-class="getGradientForSession(event.session_id)"
                    :color-class="getColorForSession(event.session_id)"
                    :app-gradient-class="getGradientForApp(event.source_app)"
                    :app-color-class="getColorForApp(event.source_app)"
                    :app-hex-color="getHexColorForApp(event.source_app)"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- Collapsed State -->
          <div v-else class="px-2 sm:px-3">
            <div class="flex flex-col items-center gap-2 sm:gap-3 py-3 sm:py-4 text-xs sm:text-sm text-[var(--theme-text-tertiary)]">
              <div class="flex -space-x-1">
                <div
                  v-for="session in getUniqueSessions(lane.events).slice(0, isMobile ? 2 : 3)"
                  :key="session"
                  class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[var(--theme-bg-primary)] flex items-center justify-center text-[10px] sm:text-xs font-mono"
                  :style="{ backgroundColor: getColorForSession(session) }"
                  :title="`Session ${session.slice(0, 8)}`"
                >
                  {{ session.slice(0, 1).toUpperCase() }}
                </div>
                <div
                  v-if="getUniqueSessions(lane.events).length > (isMobile ? 2 : 3)"
                  class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[var(--theme-bg-primary)] bg-[var(--theme-bg-tertiary)] flex items-center justify-center text-[10px] sm:text-xs"
                >
                  +{{ getUniqueSessions(lane.events).length - (isMobile ? 2 : 3) }}
                </div>
              </div>
              <div class="text-center">
                <div>{{ lane.eventCount }} events</div>
                <div>{{ getUniqueSessions(lane.events).length }} sessions</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State for All Lanes -->
        <div v-if="sortedLanes.length === 0" class="text-center py-16 w-full flex-1 flex flex-col items-center justify-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--theme-bg-tertiary)] via-[var(--theme-bg-quaternary)] to-[var(--theme-bg-tertiary)] flex items-center justify-center shadow-inner border border-[var(--theme-border-primary)]/20">
            <div class="relative">
              <Activity class="w-8 h-8 text-[var(--theme-text-quaternary)]" />
              <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
            </div>
          </div>
          <p class="text-lg font-semibold text-[var(--theme-text-secondary)] mb-2">Waiting for events...</p>
          <p class="text-sm text-[var(--theme-text-tertiary)] max-w-sm mx-auto">Your project events will appear in separate columns as activities are detected</p>
          <div class="mt-6 flex justify-center">
            <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
              <div class="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
              <span class="text-xs text-[var(--theme-text-tertiary)]">Swimlane monitoring active</span>
            </div>
          </div>
        </div>
        <!-- End Empty State for All Lanes -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Activity, ChevronDown, Pin } from 'lucide-vue-next'
import type { HookEvent } from '~/types'
import type { GroupedEvent, ProjectLane } from '~/types/grouping'
import EventRow from './EventRow.vue'
import GroupedEventCard from './GroupedEventCard.vue'
import TimestampColumn from './TimestampColumn.vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useEventColors } from '~/composables/useEventColors'
import { useGroupingPreferences } from '~/composables/useGroupingPreferences'
import { useEventGrouping } from '~/composables/useEventGrouping'
import { useEventAnimations } from '~/composables/useEventAnimations'
import { useMediaQuery } from '~/composables/useMediaQuery'

const props = defineProps<{
  events: HookEvent[]
  filters: {
    sessionId: string
    eventType: string
  }
  selectedProject?: string
  stickToBottom: boolean
}>()

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean]
  'scroll-sync': [scrollTop: number]
}>()

const scrollContainer = ref<HTMLElement>()
const scrollTop = ref(0)
const { getGradientForSession, getColorForSession, getGradientForApp, getColorForApp, getHexColorForApp } = useEventColors()
const { groupingPreferences, swimlanePreferences, toggleLaneCollapsed, toggleLanePinned } = useGroupingPreferences()
const { isMobile, isTablet } = useMediaQuery()

// Dynamic width calculation for swimlanes
const containerWidth = ref(0)

// Apply event grouping to raw events (similar to EventTimeline)
const { groupedEvents, getGroupChangeType } = useEventGrouping(
  computed(() => props.events),
  groupingPreferences
)

// Animation system
const { processEventAnimation, getAnimationClasses } = useEventAnimations()

// Project extraction helper
const projectOf = (e: HookEvent | GroupedEvent) => {
  return (e as any).project || (e as any).payload?.project || e.source_app
}

// All events sorted chronologically for the timestamp column
const allEventsSorted = computed(() => {
  return [...groupedEvents.value].sort((a, b) => {
    const aTime = ('groupMeta' in a) 
      ? (a as GroupedEvent).groupMeta.timeRange[1] 
      : (a.timestamp || 0)
    const bTime = ('groupMeta' in b) 
      ? (b as GroupedEvent).groupMeta.timeRange[1] 
      : (b.timestamp || 0)
    return bTime - aTime // newest first
  })
})

// Create project lanes from events
const projectLanes = computed<ProjectLane[]>(() => {
  const laneMap = new Map<string, ProjectLane>()
  
  for (const event of groupedEvents.value) {
    const sourceApp = projectOf(event)
    
    if (!laneMap.has(sourceApp)) {
      laneMap.set(sourceApp, {
        sourceApp,
        events: [],
        lastActivity: 0,
        eventCount: 0,
        isPinned: swimlanePreferences.value.pinnedLanes.includes(sourceApp),
        isCollapsed: swimlanePreferences.value.collapsedLanes.includes(sourceApp)
      })
    }
    
    const lane = laneMap.get(sourceApp)!
    
    // Apply filters
    if (props.selectedProject && sourceApp !== props.selectedProject) continue
    if (props.filters.sessionId && props.filters.sessionId !== '__ALL_SESSIONS__' && event.session_id !== props.filters.sessionId) continue
    if (props.filters.eventType && props.filters.eventType !== '__ALL_TYPES__' && event.hook_event_type !== props.filters.eventType) continue
    
    lane.events.push(event)
    
    const eventTime = ('groupMeta' in event) 
      ? (event as GroupedEvent).groupMeta.timeRange[1] 
      : (event.timestamp || 0)
    
    if (eventTime > lane.lastActivity) {
      lane.lastActivity = eventTime
    }
    
    lane.eventCount++
  }
  
  // Filter empty lanes and sort events within each lane
  const lanes = Array.from(laneMap.values()).map(lane => {
    // Sort events within each lane by timestamp (newest first)
    lane.events.sort((a, b) => {
      const aTime = ('groupMeta' in a) 
        ? (a as GroupedEvent).groupMeta.timeRange[1] 
        : (a.timestamp || 0)
      const bTime = ('groupMeta' in b) 
        ? (b as GroupedEvent).groupMeta.timeRange[1] 
        : (b.timestamp || 0)
      return bTime - aTime
    })
    return lane
  })
  
  if (!swimlanePreferences.value.showEmptyLanes) {
    return lanes.filter(lane => lane.eventCount > 0)
  }
  
  return lanes
})

// Sort lanes by priority: pinned first, then by last activity
const sortedLanes = computed(() => {
  return [...projectLanes.value].sort((a, b) => {
    // Pinned lanes first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    
    // Then by custom order if specified
    const aIndex = swimlanePreferences.value.laneOrder.indexOf(a.sourceApp)
    const bIndex = swimlanePreferences.value.laneOrder.indexOf(b.sourceApp)
    
    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex
    }
    if (aIndex >= 0) return -1
    if (bIndex >= 0) return 1
    
    // Finally by last activity (most recent first)
    return b.lastActivity - a.lastActivity
  })
})

// Calculate optimal lane width based on container and number of lanes
const calculatedLaneWidth = computed(() => {
  // Responsive minimum widths
  const minWidth = isMobile.value ? 280 : isTablet.value ? 320 : 400
  const laneCount = sortedLanes.value.length
  
  if (laneCount === 0) return minWidth
  
  // Responsive gap and padding calculations
  const gapSize = isMobile.value ? 12 : 24 // gap-3 vs gap-6
  const containerPadding = isMobile.value ? 16 : 32 // px-2 vs px-4
  
  // Try to fit all lanes in viewport, but respect minimum width
  const availableWidth = containerWidth.value - (containerPadding + (laneCount - 1) * gapSize)
  const calculatedWidth = Math.max(minWidth, Math.floor(availableWidth / laneCount))
  
  return calculatedWidth
})

// Determine if horizontal scrolling is needed
const needsHorizontalScroll = computed(() => {
  const gapSize = isMobile.value ? 12 : 24
  const containerPadding = isMobile.value ? 16 : 32
  
  const totalRequiredWidth = sortedLanes.value.length * calculatedLaneWidth.value + 
                            containerPadding + 
                            (sortedLanes.value.length - 1) * gapSize
  return totalRequiredWidth > containerWidth.value
})

// Helper functions
const isLaneCollapsed = (sourceApp: string) => {
  return swimlanePreferences.value.collapsedLanes.includes(sourceApp)
}

const isLaneActive = (sourceApp: string) => {
  const lane = projectLanes.value.find(l => l.sourceApp === sourceApp)
  if (!lane) return false
  
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  return lane.lastActivity > fiveMinutesAgo
}

const getUniqueSessions = (events: (HookEvent | GroupedEvent)[]) => {
  const sessions = new Set<string>()
  
  for (const event of events) {
    if ('groupMeta' in event) {
      // For grouped events, add all child sessions
      for (const child of (event as GroupedEvent).groupMeta.children) {
        sessions.add(child.session_id)
      }
    } else {
      sessions.add(event.session_id)
    }
  }
  
  return Array.from(sessions)
}

const getEventKey = (event: HookEvent | GroupedEvent) => {
  if ('groupMeta' in event) {
    // Use a stable key for grouped events based on the first child event ID
    const groupedEvent = event as GroupedEvent
    const firstChildId = groupedEvent.groupMeta.children[0]?.id || 'unknown'
    return `group-${firstChildId}-${groupedEvent.groupMeta.children.length}`
  }
  // For individual events, use just the ID which should be stable
  return `event-${event.id}`
}

const formatLastActivity = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// Scroll handling
const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
}

const handleScroll = () => {
  if (!scrollContainer.value) return
  
  const { scrollTop: currentScrollTop } = scrollContainer.value
  scrollTop.value = currentScrollTop
  const isAtTop = currentScrollTop < 50
  
  if (isAtTop !== props.stickToBottom) {
    emit('update:stickToBottom', isAtTop)
  }
  
  // Emit both vertical and horizontal scroll positions for potential synchronization
  emit('scroll-sync', currentScrollTop)
}

// Auto-scroll when new events arrive
watch(() => props.events.length, async (newLength, oldLength) => {
  if (newLength > oldLength && props.stickToBottom) {
    await nextTick()
    scrollToTop()
  }
})

watch(() => props.stickToBottom, (shouldStick) => {
  if (shouldStick) {
    scrollToTop()
  }
})

// Watch for changes in events and ensure lanes are updated
watch(() => props.events, (newEvents, oldEvents) => {
  console.log('[EventSwimlanes] Raw events changed:', {
    newCount: newEvents.length,
    oldCount: oldEvents?.length || 0,
    stickToBottom: props.stickToBottom,
    laneCount: sortedLanes.value.length,
    latestEvents: newEvents.slice(0, 3).map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      hook_event_type: e.hook_event_type,
      source_app: e.source_app
    }))
  })
}, { deep: true, immediate: true })

// Process animations when grouped events change
watch(groupedEvents, async (newGrouped, oldGrouped) => {
  console.log('[EventSwimlanes] Grouped events changed:', {
    newCount: newGrouped.length,
    oldCount: oldGrouped?.length || 0,
    groupedCount: newGrouped.filter(e => 'groupMeta' in e).length,
    individualCount: newGrouped.filter(e => !('groupMeta' in e)).length
  })
  
  // Process animations for each event
  for (const event of newGrouped) {
    const eventId = getEventKey(event)
    let changeType: 'new' | 'updated' | 'unchanged' = 'new'
    
    if ('groupMeta' in event) {
      // For grouped events, check the group change type
      changeType = getGroupChangeType(String(event.id) || 'unknown')
    } else {
      // For individual events, check if we've seen this ID before
      const existsInOld = oldGrouped?.some(e => getEventKey(e) === eventId)
      changeType = existsInOld ? 'unchanged' : 'new'
    }
    
    await processEventAnimation(eventId, changeType)
  }
}, { deep: true, immediate: true })

// Debug width calculations
watch([containerWidth, sortedLanes], ([newContainerWidth, newLanes]) => {
  console.log('[EventSwimlanes] Width calculations:', {
    containerWidth: newContainerWidth,
    laneCount: newLanes.length,
    calculatedWidth: calculatedLaneWidth.value,
    needsScroll: needsHorizontalScroll.value
  })
}, { deep: true })

// Update lane order when lanes change
watch(sortedLanes, (newLanes) => {
  const newOrder = newLanes.map(lane => lane.sourceApp)
  // Only update if the order actually changed to avoid infinite loops
  const currentOrder = swimlanePreferences.value.laneOrder
  if (JSON.stringify(newOrder) !== JSON.stringify(currentOrder)) {
    swimlanePreferences.value.laneOrder = newOrder
  }
}, { deep: true })

// ResizeObserver to track container width
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (scrollContainer.value) {
    // Initial width measurement
    containerWidth.value = scrollContainer.value.clientWidth
    
    // Set up ResizeObserver to track width changes
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    
    resizeObserver.observe(scrollContainer.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
/* Lane Event Animations */
.lane-event-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lane-event-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.lane-event-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lane-event-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.9);
}

.lane-event-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

/* Smooth scroll behavior */
.smooth-scroll {
  scroll-behavior: smooth;
}

/* Mobile-specific improvements */
@media (max-width: 768px) {
  .swimlane-container {
    touch-action: pan-x pan-y;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  /* Reduce motion for mobile performance */
  @media (prefers-reduced-motion: reduce) {
    .lane-event-enter-active,
    .lane-event-leave-active,
    .lane-event-move {
      transition: none;
    }
    
    .animate-fade-in,
    .animate-slide-up,
    .animate-fade-out,
    .animate-slide-down,
    .animate-pulse-gentle,
    .animate-pulse-brief,
    .animate-highlight {
      animation: none;
    }
  }
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: var(--theme-bg-tertiary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: var(--theme-border-primary);
  border-radius: 3px;
  opacity: 0.5;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}

/* Touch scrolling for mobile */
@media (max-width: 768px) {
  .touch-pan-x {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  ::-webkit-scrollbar {
    width: 2px;
    height: 2px;
  }
}

/* Enhanced Animation Classes */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
}

@keyframes slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(10px);
  }
}

@keyframes pulse-gentle {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--theme-primary, #3b82f6);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
}

@keyframes pulse-brief {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes highlight {
  0% {
    background-color: transparent;
    border-left-color: var(--theme-border-primary);
  }
  50% {
    background-color: rgba(59, 130, 246, 0.1);
    border-left-color: var(--theme-primary, #3b82f6);
  }
  100% {
    background-color: transparent;
    border-left-color: var(--theme-border-primary);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fade-out {
  animation: fade-out 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
}

.animate-slide-down {
  animation: slide-down 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
}

.animate-pulse-gentle {
  animation: pulse-gentle 0.8s ease-in-out forwards;
}

.animate-pulse-brief {
  animation: pulse-brief 0.6s ease-in-out forwards;
}

.animate-highlight {
  animation: highlight 0.8s ease-in-out forwards;
}
</style>