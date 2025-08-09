<template>
  <div class="relative w-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Cpu class="w-5 h-5" />
        Model Distribution
      </h3>
      <Badge variant="outline" class="text-xs">
        {{ totalEntries }} {{ totalEntries === 1 ? 'entry' : 'entries' }}
      </Badge>
    </div>
    
    <div v-if="!hasData" class="text-center py-8 text-muted-foreground">
      <div class="w-12 h-12 rounded-full border-4 border-muted bg-muted/20 mx-auto mb-3 flex items-center justify-center">
        <Cpu class="w-6 h-6" />
      </div>
      <p class="text-sm">No model data available</p>
    </div>
    
    <div v-else class="space-y-4">
      <!-- Donut Chart -->
      <ClientOnly>
        <div class="relative">
          <VisSingleContainer
            :data="chartData"
            :width="280"
            :height="280"
            class="mx-auto"
          >
            <VisDonut
              :angle-value="(d: any) => d.value"
              :color="(d: any, i: number) => colors[i % colors.length]"
              :padAngle="0.02"
              :cornerRadius="3"
              :innerRadius="80"
              :outerRadius="120"
              :showBackground="false"
            />
          </VisSingleContainer>
          
          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div class="text-2xl font-bold text-foreground">{{ modelData.length }}</div>
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              {{ modelData.length === 1 ? 'Model' : 'Models' }}
            </div>
          </div>
        </div>
      </ClientOnly>
      
      <!-- Legend -->
      <div class="space-y-2">
        <div
          v-for="(item, index) in chartData"
          :key="item.name"
          class="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: colors[index % colors.length] }"
            />
            <div>
              <div class="font-medium text-sm">{{ formatModelName(item.name) }}</div>
              <div class="text-xs text-muted-foreground">
                {{ item.tokenCount.toLocaleString() }} tokens
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold">{{ item.percentage.toFixed(1) }}%</div>
            <div class="text-xs text-muted-foreground">{{ item.value }} entries</div>
          </div>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="mt-4 p-3 bg-muted/20 rounded-lg">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="text-center">
            <div class="font-semibold">Most Used</div>
            <div class="text-muted-foreground">{{ formatModelName(mostUsedModel) }}</div>
          </div>
          <div class="text-center">
            <div class="font-semibold">Total Tokens</div>
            <div class="text-muted-foreground">{{ formatNumber(totalTokens) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Cpu } from 'lucide-vue-next'

interface ModelEntry {
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  }
}

const props = defineProps<{
  modelData: string[]  // Array of model names from ccusage
  entries?: ModelEntry[] // Optional: Raw entries for detailed token analysis
}>()

// Generate attractive colors for the chart
const colors = computed(() => {
  const chartColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6366f1', // indigo
  ]
  return chartColors
})

// Calculate model distribution data
const chartData = computed(() => {
  if (!props.modelData || props.modelData.length === 0) return []
  
  // Count occurrences of each model
  const modelCounts = new Map<string, number>()
  const modelTokens = new Map<string, number>()
  
  props.modelData.forEach(model => {
    modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
  })
  
  // If entries are provided, calculate token usage per model
  if (props.entries) {
    props.entries.forEach(entry => {
      const currentTokens = modelTokens.get(entry.model) || 0
      const entryTokens = (entry.usage.inputTokens || 0) + 
                         (entry.usage.outputTokens || 0) + 
                         (entry.usage.cacheCreationInputTokens || 0) + 
                         (entry.usage.cacheReadInputTokens || 0)
      modelTokens.set(entry.model, currentTokens + entryTokens)
    })
  }
  
  const total = props.modelData.length
  
  return Array.from(modelCounts.entries())
    .map(([model, count]) => ({
      name: model,
      value: count,
      percentage: (count / total) * 100,
      tokenCount: modelTokens.get(model) || 0
    }))
    .sort((a, b) => b.value - a.value) // Sort by usage count
})

// Computed properties
const hasData = computed(() => chartData.value.length > 0)
const totalEntries = computed(() => props.modelData.length)

const mostUsedModel = computed(() => {
  if (chartData.value.length === 0) return 'None'
  return chartData.value[0].name
})

const totalTokens = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.tokenCount, 0)
})

// Format model name to be more readable
const formatModelName = (model: string): string => {
  // Extract the main model name (e.g., "claude-sonnet-4" from "claude-sonnet-4-20250514")
  const parts = model.split('-')
  if (parts.length > 3) {
    return parts.slice(0, 3).join('-')
  }
  return model
}

// Format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}
</script>