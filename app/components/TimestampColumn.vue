<template>
  <div 
    class="timestamp-column sticky left-0 z-20 flex-shrink-0 bg-[var(--theme-bg-primary)]/95 backdrop-blur-sm border-r border-[var(--theme-border-primary)]/20"
    :class="[
      'w-10 xs:w-12 sm:w-14 md:w-16 lg:w-20', // Progressive responsive width
      hasEvents && 'shadow-sm'
    ]"
  >
    <div class="h-full relative">
      <!-- Timeline Header -->
      <div class="sticky top-0 z-30 bg-[var(--theme-bg-primary)]/95 backdrop-blur-lg border-b border-[var(--theme-border-primary)]/20 px-1 xs:px-1.5 sm:px-2 md:px-3 py-2">
        <span class="text-[8px] xs:text-[9px] sm:text-[10px] text-[var(--theme-text-tertiary)] uppercase tracking-wide font-medium">{{ isMobile ? 'T' : 'Time' }}</span>
      </div>
      
      <!-- Timestamp Entries -->
      <div class="space-y-2 sm:space-y-3 px-0.5 xs:px-1 sm:px-2 py-2 sm:py-3">
        <div
          v-for="entry in timestampEntries"
          :key="entry.id"
          class="text-right overflow-hidden"
          :style="{ height: entry.height + 'px', minHeight: entry.minHeight + 'px' }"
        >
          <div class="flex flex-col justify-start h-full pt-2">
            <!-- Primary Timestamp -->
            <span 
              class="text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] text-[var(--theme-text-tertiary)] whitespace-nowrap leading-tight block truncate"
              :title="entry.fullTime"
            >
              {{ isMobile ? entry.veryShortTime : (isTablet ? entry.shortTime : entry.time) }}
            </span>
            
            <!-- Time Range for Grouped Events -->
            <span 
              v-if="entry.isGrouped && entry.endTime && !isMobile" 
              class="text-[7px] xs:text-[8px] sm:text-[9px] text-[var(--theme-text-quaternary)] whitespace-nowrap leading-tight mt-0.5 block truncate"
              :title="entry.fullTimeRange"
            >
              {{ entry.duration }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="!hasEvents" class="flex flex-col items-center justify-center h-24 sm:h-32 px-0.5 xs:px-1 sm:px-2 text-center">
        <div class="w-3 h-3 xs:w-4 xs:h-4 sm:w-6 sm:h-6 rounded-full bg-[var(--theme-bg-tertiary)]/50 flex items-center justify-center mb-1 sm:mb-2">
          <div class="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--theme-text-quaternary)]"></div>
        </div>
        <span class="text-[7px] xs:text-[8px] sm:text-[9px] text-[var(--theme-text-quaternary)] leading-tight">{{ isMobile ? 'None' : 'No events' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HookEvent } from '~/types'
import type { GroupedEvent } from '~/types/grouping'
import { useMediaQuery } from '~/composables/useMediaQuery'

interface TimestampEntry {
  id: string
  time: string
  shortTime: string
  veryShortTime: string
  endTime?: string
  duration?: string
  fullTime: string
  fullTimeRange?: string
  isGrouped: boolean
  height: number
  minHeight: number
}

const props = defineProps<{
  events: (HookEvent | GroupedEvent)[]
  scrollTop?: number
}>()

const { isMobile, isTablet } = useMediaQuery()
const hasEvents = computed(() => props.events.length > 0)

const timestampEntries = computed<TimestampEntry[]>(() => {
  return props.events.map((event) => {
    const isGrouped = 'groupMeta' in event
    
    if (isGrouped) {
      const groupedEvent = event as GroupedEvent
      const startTime = groupedEvent.groupMeta.timeRange[0]
      const endTime = groupedEvent.groupMeta.timeRange[1]
      const duration = formatDuration(endTime - startTime)
      
      return {
        id: `group-${groupedEvent.id}`,
        time: formatTime(startTime),
        shortTime: formatShortTime(startTime),
        veryShortTime: formatVeryShortTime(startTime),
        endTime: formatTime(endTime),
        duration: duration,
        fullTime: formatFullTime(startTime),
        fullTimeRange: `${formatFullTime(startTime)} - ${formatFullTime(endTime)}`,
        isGrouped: true,
        height: calculateGroupedEventHeight(groupedEvent),
        minHeight: 60
      }
    } else {
      return {
        id: `event-${event.id}`,
        time: formatTime(event.timestamp),
        shortTime: formatShortTime(event.timestamp),
        veryShortTime: formatVeryShortTime(event.timestamp),
        fullTime: formatFullTime(event.timestamp),
        isGrouped: false,
        height: calculateEventHeight(event),
        minHeight: 50
      }
    }
  })
})

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatShortTime = (timestamp?: number) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const formatVeryShortTime = (timestamp?: number) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

const formatFullTime = (timestamp?: number) => {
  if (!timestamp) return 'Invalid time'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const formatDuration = (durationMs: number) => {
  const seconds = Math.round(durationMs / 1000)
  
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const calculateEventHeight = (event: HookEvent) => {
  // Base height for individual events
  let height = 50
  
  // Add height based on event complexity
  if (event.summary && event.summary.length > 50) height += 20
  if (event.payload && Object.keys(event.payload).length > 3) height += 10
  
  return Math.max(height, 50)
}

const calculateGroupedEventHeight = (groupedEvent: GroupedEvent) => {
  // Base height for grouped events
  let height = 60
  
  // Add height for each child event (partial)
  const childCount = groupedEvent.groupMeta.children.length
  height += Math.min(childCount * 5, 40) // Cap the additional height
  
  // Add height for chips/files
  if (groupedEvent.groupMeta.chips && groupedEvent.groupMeta.chips.length > 3) {
    height += 15
  }
  
  return Math.max(height, 60)
}
</script>

<style scoped>
.timestamp-column {
  /* Ensure proper stacking and positioning */
  position: sticky;
  left: 0;
  z-index: 20;
  /* Fix scroll issues on mobile */
  -webkit-overflow-scrolling: touch;
}

.timestamp-column::after {
  /* Subtle right border gradient */
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--theme-border-primary, #e2e8f0) 20%,
    var(--theme-border-primary, #e2e8f0) 80%,
    transparent 100%
  );
  opacity: 0.3;
}

/* Responsive adjustments */
@media (max-width: 639px) {
  .timestamp-column {
    width: 3rem; /* 48px */
  }
}

@media (min-width: 640px) and (max-width: 768px) {
  .timestamp-column {
    width: 4rem; /* 64px */
  }
}

@media (min-width: 769px) {
  .timestamp-column {
    width: 5rem; /* 80px */
  }
}

/* Smooth scrolling alignment */
.timestamp-column::-webkit-scrollbar {
  display: none;
}

.timestamp-column {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>