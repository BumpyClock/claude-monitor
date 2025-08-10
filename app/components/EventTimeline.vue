<template>
  <div class="flex-1 mobile:h-[50vh] flex overflow-hidden bg-[var(--theme-bg-secondary)] touch-pan-y">
    <!-- Global Timestamp Column -->
    <TimestampColumn 
      :events="filteredEventsSorted" 
      :scroll-top="scrollTop"
    />
    
    <!-- Scrollable Event List -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto overflow-x-hidden py-3 mobile:py-2 relative min-w-0 mobile-no-scroll"
      @scroll="handleScroll"
      style="-webkit-overflow-scrolling: touch;"
    >
      <div class="relative overflow-x-hidden min-w-0 px-2 sm:px-4">
        <div class="space-y-2 sm:space-y-3 min-w-0">
          <template v-for="event in filteredEventsSorted" :key="getEventKey(event)">
            <!-- Grouped Event Card with Animation -->
            <div
              v-if="'groupMeta' in event"
              :class="getAnimationClasses(getEventKey(event))"
              class="transition-all duration-200"
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
              class="transition-all duration-200"
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
      
      <!-- Historical Loading Indicator -->
      <div v-if="isLoadingHistorical" class="flex justify-center py-4 text-[var(--theme-text-tertiary)]">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm">Loading historical events...</span>
        </div>
      </div>
      
      <div v-if="filteredEvents.length === 0" class="text-center py-12 mobile:py-8 text-[var(--theme-text-tertiary)] animate-fadeIn">
        <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--theme-bg-tertiary)] via-[var(--theme-bg-quaternary)] to-[var(--theme-bg-tertiary)] flex items-center justify-center shadow-inner border border-[var(--theme-border-primary)]/20">
          <div class="relative">
            <Activity class="w-8 h-8 text-[var(--theme-text-quaternary)]" />
            <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
          </div>
        </div>
        <p class="text-lg mobile:text-base font-semibold text-[var(--theme-text-secondary)] mb-2">Waiting for events...</p>
        <p class="text-sm mobile:text-xs text-[var(--theme-text-tertiary)] max-w-sm mx-auto">Your live event stream will appear here as activities are detected from your applications</p>
        <div class="mt-6 flex justify-center">
          <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
            <div class="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
            <span class="text-xs text-[var(--theme-text-tertiary)]">Live monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Activity } from 'lucide-vue-next';
import type { HookEvent, FilterOptions } from '~/types';
import type { GroupedEvent } from '~/types/grouping';
import EventRow from './EventRow.vue';
import GroupedEventCard from './GroupedEventCard.vue';
import TimestampColumn from './TimestampColumn.vue';
import { useEventColors } from '~/composables/useEventColors';
import { useEventGrouping } from '~/composables/useEventGrouping';
import { useGroupingPreferences } from '~/composables/useGroupingPreferences';
import { useEventAnimations } from '~/composables/useEventAnimations';
import { useWebSocket } from '~/composables/useWebSocket';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  filters: {
    sessionId: string;
    eventType: string;
  };
  stickToBottom: boolean;
  selectedProject?: string;
}>();

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean];
  'update:filters': [filters: typeof props.filters];
  'scroll-sync': [scrollTop: number];
}>();

const scrollContainer = ref<HTMLElement>();
const scrollTop = ref(0);
const { getGradientForSession, getColorForSession, getGradientForApp, getColorForApp, getHexColorForApp } = useEventColors();

// WebSocket connection for combined events
const { websocketUrl } = useServerConfig();
const { allEvents, isLoadingHistorical, handleScroll: infiniteScrollHandler } = useWebSocket(websocketUrl.value);

// Enhanced grouping system
const { groupingPreferences } = useGroupingPreferences();
const { groupedEvents, groupingStats, getGroupChangeType } = useEventGrouping(
  allEvents,
  groupingPreferences
);

// Animation system
const { processEventAnimation, getAnimationClasses } = useEventAnimations();

const projectOf = (e: HookEvent) => (e as any).project || (e as any).payload?.project || e.source_app;

const filterOptions = ref<FilterOptions>({ source_apps: [], session_ids: [], hook_event_types: [] });
const localFilters = ref({ 
  sessionId: props.filters.sessionId || '__ALL_SESSIONS__',
  eventType: props.filters.eventType || '__ALL_TYPES__'
});

// Watch for changes in parent filters to keep local state in sync
watch(() => props.filters, (newFilters) => {
  localFilters.value = { 
    sessionId: newFilters.sessionId || '__ALL_SESSIONS__',
    eventType: newFilters.eventType || '__ALL_TYPES__'
  };
}, { deep: true });

const hasActiveFilters = computed(() => 
  (localFilters.value.sessionId && localFilters.value.sessionId !== '__ALL_SESSIONS__') || 
  (localFilters.value.eventType && localFilters.value.eventType !== '__ALL_TYPES__')
);
const emitFilters = () => emit('update:filters', { 
  sessionId: localFilters.value.sessionId === '__ALL_SESSIONS__' ? '__ALL_SESSIONS__' : localFilters.value.sessionId,
  eventType: localFilters.value.eventType === '__ALL_TYPES__' ? '__ALL_TYPES__' : localFilters.value.eventType
});
const clearLocalFilters = () => { 
  localFilters.value = { sessionId: '__ALL_SESSIONS__', eventType: '__ALL_TYPES__' }; 
  emitFilters(); 
};

const fetchFilterOptions = async () => {
  const { apiUrl } = useServerConfig();
  try {
    const res = await fetch(apiUrl('/events/filter-options'));
    if (res.ok) filterOptions.value = await res.json();
  } catch {}
};

const updateSessionFilter = (value: any) => {
  localFilters.value.sessionId = (value === '__ALL__' || !value) ? '__ALL_SESSIONS__' : String(value);
  emitFilters();
};

const updateEventTypeFilter = (value: any) => {
  localFilters.value.eventType = (value === '__ALL__' || !value) ? '__ALL_TYPES__' : String(value);
  emitFilters();
};

onMounted(() => { fetchFilterOptions(); setInterval(fetchFilterOptions, 10000); });

const filteredEvents = computed(() => {
  return groupedEvents.value.filter((event: HookEvent | GroupedEvent) => {
    if (props.selectedProject && projectOf(event) !== props.selectedProject) return false;
    if (props.filters.sessionId && props.filters.sessionId !== '__ALL_SESSIONS__' && event.session_id !== props.filters.sessionId) return false;
    if (props.filters.eventType && props.filters.eventType !== '__ALL_TYPES__' && event.hook_event_type !== props.filters.eventType) return false;
    return true;
  });
});

const filteredEventsSorted = computed(() => {
  return [...filteredEvents.value].sort((a, b) => {
    const aTime = ('groupMeta' in a) ? (a as GroupedEvent).groupMeta.timeRange[1] : (a.timestamp || 0);
    const bTime = ('groupMeta' in b) ? (b as GroupedEvent).groupMeta.timeRange[1] : (b.timestamp || 0);
    return bTime - aTime;
  });
});

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
};

const handleScroll = () => {
  if (!scrollContainer.value) return;
  const currentScrollTop = scrollContainer.value.scrollTop;
  scrollTop.value = currentScrollTop;
  const isAtTop = currentScrollTop < 50;
  if (isAtTop !== props.stickToBottom) emit('update:stickToBottom', isAtTop);
  
  // Emit scroll position for activity timeline synchronization
  emit('scroll-sync', currentScrollTop);
  
  // Handle infinite scroll for historical data loading
  infiniteScrollHandler(scrollContainer.value);
};

watch(() => allEvents.value.length, async () => {
  if (props.stickToBottom) { await nextTick(); scrollToTop(); }
});

// Process animations when grouped events change
watch(groupedEvents, async (newGrouped, oldGrouped) => {
  console.log('[EventTimeline] Grouped events changed:', {
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
      changeType = getGroupChangeType(String(event.id ?? 'unknown'))
    } else {
      // For individual events, check if we've seen this ID before
      const existsInOld = oldGrouped?.some(e => getEventKey(e) === eventId)
      changeType = existsInOld ? 'unchanged' : 'new'
    }
    
    await processEventAnimation(eventId, changeType)
  }
}, { deep: true, immediate: true })

watch(allEvents, (newEvents) => {
  console.log('[EventTimeline] Combined events changed:', {
    count: newEvents.length,
    latestEvents: newEvents.slice(-3).map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      hook_event_type: e.hook_event_type,
      session_id: e.session_id?.slice(0, 8),
      summary: e.summary,
      source_app: e.source_app
    }))
  });
}, { deep: true });

// Helper function to get unique key for events
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

// Expose grouping stats for debugging
defineExpose({
  groupingStats
});

watch(() => props.stickToBottom, (shouldStick) => { if (shouldStick) { scrollToTop(); } });
</script>

<style scoped>
.event-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.event-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.event-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
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