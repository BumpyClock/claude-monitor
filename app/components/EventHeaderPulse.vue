<template>
  <div class="bg-gradient-to-br from-background/95 to-secondary/95 relative overflow-hidden">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
    </div>
    
    <!-- Content -->
    <div class="relative z-10">
      <LivePulseChart :events="events" :filters="filters" :timeline-scroll="timelineScroll" />
    </div>
    
    <!-- Glow effect overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-primary/5 pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
import LivePulseChart from './LivePulseChart.vue'

// Simple interface for hook events - adjust as needed for your types
interface HookEvent {
  timestamp: number
  source_app: string
  hook_event_type: string
}

defineProps<{
  events: HookEvent[]
  filters: { sessionId: string; eventType: string }
  timelineScroll?: number
}>()
</script>