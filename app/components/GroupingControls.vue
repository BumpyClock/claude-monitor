<template>
  <div class="space-y-4">
    <!-- Grouping Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold">Event Grouping</h3>
        <p class="text-xs text-muted-foreground">Automatically group similar events together</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="toggleGrouping"
        :class="[
          'transition-all duration-200',
          groupingPreferences.enabled
            ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
            : 'hover:bg-muted'
        ]"
      >
        {{ groupingPreferences.enabled ? 'ON' : 'OFF' }}
      </Button>
    </div>

    <!-- Grouping Settings (when enabled) -->
    <div v-if="groupingPreferences.enabled" class="space-y-4 pt-2">
      <!-- Time Window -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-muted-foreground">
            Time Window
          </label>
          <span class="text-xs font-mono text-muted-foreground">
            {{ timeWindowSeconds }}s
          </span>
        </div>
        <div class="space-y-2">
          <input
            type="range"
            :value="groupingPreferences.timeWindow"
            @input="updateTimeWindow($event)"
            min="2000"
            max="15000"
            step="1000"
            class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>2s</span>
            <span>15s</span>
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground">
          Quick Presets
        </label>
        <div class="grid grid-cols-3 gap-1">
          <Button
            v-for="preset in presets"
            :key="preset.name"
            variant="outline"
            size="sm"
            class="text-xs py-1"
            @click="applyPreset(preset.key)"
            :class="[
              isActivePreset(preset.key) && 'bg-primary/10 border-primary/40 text-primary'
            ]"
          >
            {{ preset.name }}
          </Button>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-muted-foreground">
            Advanced
          </label>
          <Button
            variant="ghost"
            size="sm"
            @click="showAdvanced = !showAdvanced"
            class="h-auto p-1"
          >
            <ChevronDown 
              :class="[
                'h-3 w-3 transition-transform',
                showAdvanced && 'rotate-180'
              ]"
            />
          </Button>
        </div>

        <div v-if="showAdvanced" class="space-y-3 pl-2 border-l-2 border-border/20">
          <!-- Min Events to Group -->
          <div class="flex items-center justify-between">
            <label class="text-xs text-muted-foreground">
              Min events to group
            </label>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="decrementMinEvents"
                :disabled="groupingPreferences.minEventsToGroup <= 2"
                class="h-6 w-6 p-0"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <span class="text-xs font-mono w-8 text-center">
                {{ groupingPreferences.minEventsToGroup }}
              </span>
              <Button
                variant="outline"
                size="sm"
                @click="incrementMinEvents"
                :disabled="groupingPreferences.minEventsToGroup >= 10"
                class="h-6 w-6 p-0"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Max Group Size -->
          <div class="flex items-center justify-between">
            <label class="text-xs text-muted-foreground">
              Max group size
            </label>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="decrementMaxSize"
                :disabled="groupingPreferences.maxGroupSize <= 5"
                class="h-6 w-6 p-0"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <span class="text-xs font-mono w-8 text-center">
                {{ groupingPreferences.maxGroupSize }}
              </span>
              <Button
                variant="outline"
                size="sm"
                @click="incrementMaxSize"
                :disabled="groupingPreferences.maxGroupSize >= 100"
                class="h-6 w-6 p-0"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Grouping Criteria -->
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground">
              Group by
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupByTool"
                  class="rounded border-border"
                />
                <span>Tool</span>
              </label>
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupBySession"
                  class="rounded border-border"
                />
                <span>Session</span>
              </label>
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  v-model="groupingPreferences.groupByEventType"
                  class="rounded border-border"
                />
                <span>Event Type</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Swimlane Settings -->
    <div class="border-t border-border/20 pt-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold">Swimlane View</h3>
          <p class="text-xs text-muted-foreground">Show events in separate lanes by project</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="toggleSwimlanes"
          :class="[
            'transition-all duration-200',
            swimlanePreferences.enabled
              ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
              : 'hover:bg-muted'
          ]"
        >
          {{ swimlanePreferences.enabled ? 'ON' : 'OFF' }}
        </Button>
      </div>

      <div v-if="swimlanePreferences.enabled" class="mt-3 space-y-2">
        <label class="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            v-model="swimlanePreferences.showEmptyLanes"
            class="rounded border-border"
          />
          <span>Show empty lanes</span>
        </label>
      </div>
    </div>

    <!-- Stats Display -->
    <div v-if="groupingStats" class="border-t border-border/20 pt-4">
      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground">
          Grouping Stats
        </label>
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-muted-foreground">Reduction:</span>
            <span class="font-mono ml-1">
              {{ groupingStats.reductionPercentage }}%
            </span>
          </div>
          <div>
            <span class="text-muted-foreground">Groups:</span>
            <span class="font-mono ml-1">
              {{ groupingStats.groupedCount }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground">Avg size:</span>
            <span class="font-mono ml-1">
              {{ groupingStats.averageGroupSize }}
            </span>
          </div>
          <div>
            <span class="text-muted-foreground">Total:</span>
            <span class="font-mono ml-1">
              {{ groupingStats.processedEvents }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Button -->
    <div class="border-t border-border/20 pt-4">
      <Button
        variant="outline"
        size="sm"
        @click="resetToDefaults"
        class="w-full text-xs"
      >
        Reset to Defaults
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { ChevronDown, Plus, Minus } from 'lucide-vue-next'

interface GroupingStats {
  totalEvents: number
  processedEvents: number
  groupedCount: number
  individualCount: number
  reductionPercentage: number
  averageGroupSize: number
}

const props = defineProps<{
  groupingStats?: GroupingStats
}>()

// Mock preferences - in a real app these would come from a composable
const groupingPreferences = ref({
  enabled: true,
  timeWindow: 10000,
  minEventsToGroup: 2,
  maxGroupSize: 20,
  groupByTool: true,
  groupBySession: true,
  groupByEventType: true
})

const swimlanePreferences = ref({
  enabled: false,
  showEmptyLanes: true
})

const showAdvanced = ref(false)

const presets = [
  { name: 'Minimal', key: 'minimal' as const },
  { name: 'Normal', key: 'normal' as const },
  { name: 'Aggressive', key: 'aggressive' as const }
]

const timeWindowSeconds = computed(() => {
  return Math.round(groupingPreferences.value.timeWindow / 1000)
})

const toggleGrouping = () => {
  groupingPreferences.value.enabled = !groupingPreferences.value.enabled
}

const toggleSwimlanes = () => {
  swimlanePreferences.value.enabled = !swimlanePreferences.value.enabled
}

const updateTimeWindow = (value: string | number | Event) => {
  let numericValue: number;
  if (typeof value === 'string') {
    numericValue = parseInt(value);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else if (value instanceof Event && value.target) {
    const target = value.target as HTMLInputElement;
    numericValue = parseInt(target.value);
  } else {
    numericValue = groupingPreferences.value.timeWindow;
  }
  groupingPreferences.value.timeWindow = numericValue;
}

const applyPreset = (preset: 'minimal' | 'normal' | 'aggressive') => {
  switch (preset) {
    case 'minimal':
      groupingPreferences.value.timeWindow = 5000
      groupingPreferences.value.minEventsToGroup = 3
      groupingPreferences.value.maxGroupSize = 10
      break
    case 'normal':
      groupingPreferences.value.timeWindow = 10000
      groupingPreferences.value.minEventsToGroup = 2
      groupingPreferences.value.maxGroupSize = 20
      break
    case 'aggressive':
      groupingPreferences.value.timeWindow = 15000
      groupingPreferences.value.minEventsToGroup = 2
      groupingPreferences.value.maxGroupSize = 50
      break
  }
}

const isActivePreset = (preset: 'minimal' | 'normal' | 'aggressive'): boolean => {
  const prefs = groupingPreferences.value
  switch (preset) {
    case 'minimal':
      return prefs.timeWindow === 5000 && prefs.minEventsToGroup === 3 && prefs.maxGroupSize === 10
    case 'normal':
      return prefs.timeWindow === 10000 && prefs.minEventsToGroup === 2 && prefs.maxGroupSize === 20
    case 'aggressive':
      return prefs.timeWindow === 15000 && prefs.minEventsToGroup === 2 && prefs.maxGroupSize === 50
    default:
      return false
  }
}

const incrementMinEvents = () => {
  if (groupingPreferences.value.minEventsToGroup < 10) {
    groupingPreferences.value.minEventsToGroup++
  }
}

const decrementMinEvents = () => {
  if (groupingPreferences.value.minEventsToGroup > 2) {
    groupingPreferences.value.minEventsToGroup--
  }
}

const incrementMaxSize = () => {
  if (groupingPreferences.value.maxGroupSize < 100) {
    groupingPreferences.value.maxGroupSize += 5
  }
}

const decrementMaxSize = () => {
  if (groupingPreferences.value.maxGroupSize > 5) {
    groupingPreferences.value.maxGroupSize -= 5
  }
}

const resetToDefaults = () => {
  groupingPreferences.value = {
    enabled: true,
    timeWindow: 10000,
    minEventsToGroup: 2,
    maxGroupSize: 20,
    groupByTool: true,
    groupBySession: true,
    groupByEventType: true
  }
  swimlanePreferences.value = {
    enabled: false,
    showEmptyLanes: true
  }
}
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: hsl(var(--primary));
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: hsl(var(--primary));
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
}
</style>