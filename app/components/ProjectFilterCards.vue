<template>
  <div class="px-2 py-2 overflow-x-auto">
    <div class="flex flex-col gap-1">
      <Button size="sm" variant="outline" class="justify-between text-xs"
        :class="selectedProject === '' ? 'bg-secondary/20' : ''"
        @click="$emit('update:selectedProject', '')"
      >
        <span>All</span>
        <Badge variant="secondary">{{ totalFilteredCount }}</Badge>
      </Button>
      <Button
        v-for="p in projectsWithCounts"
        :key="p.name"
        size="sm"
        variant="outline"
        class="justify-between text-xs"
        :class="selectedProject === p.name ? 'bg-secondary/20' : ''"
        @click="$emit('update:selectedProject', p.name)"
      >
        <span>{{ getDisplayName(p.name) }}</span>
        <Badge variant="secondary">{{ p.count }}</Badge>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

// Simple interface for hook events - adjust as needed for your types
interface HookEvent {
  source_app: string
  session_id: string
  hook_event_type: string
  payload?: any
  project?: string
}

const props = defineProps<{
  events: HookEvent[]
  selectedProject: string
  filters?: {
    sessionId: string
    eventType: string
  }
}>()

defineEmits<{
  'update:selectedProject': [value: string]
}>()

// Simple display name function - replace with your actual implementation
const getDisplayName = (name: string): string => {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const projectOf = (e: HookEvent) => (e as any).project || (e as any).payload?.project || e.source_app

const baseFilteredEvents = computed(() => {
  if (!props.filters) return props.events
  return props.events.filter(event => {
    if (props.filters!.sessionId && event.session_id !== props.filters!.sessionId) return false
    if (props.filters!.eventType && event.hook_event_type !== props.filters!.eventType) return false
    return true
  })
})

const totalFilteredCount = computed(() => baseFilteredEvents.value.length)

const projectsWithCounts = computed(() => {
  const map = new Map<string, number>()
  for (const e of baseFilteredEvents.value) {
    const p = projectOf(e)
    map.set(p, (map.get(p) || 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})
</script>