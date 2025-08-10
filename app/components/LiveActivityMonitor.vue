<template>
  <Card class="p-3 bg-gradient-to-br from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 border-[var(--theme-border-primary)]/20 relative overflow-hidden">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--theme-primary)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
    </div>
    
    <!-- Content -->
    <div class="relative z-10">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></span>
            <h3 class="text-sm font-medium text-[var(--theme-text-secondary)]">Live Activity</h3>
          </div>
          <Badge :class="activityStatusClass" variant="outline" class="text-xs">
            {{ activityStatus }}
          </Badge>
        </div>
        
        <!-- Time Range Selector -->
        <div class="flex gap-1" role="tablist" aria-label="Time range selector">
          <button
            v-for="(range, index) in timeRanges"
            :key="range"
            @click="setTimeRange(range)"
            :class="[
              'px-2 py-1 text-xs rounded-md transition-all duration-150 border',
              timeRange === range
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            ]"
            role="tab"
            :aria-selected="timeRange === range"
          >
            {{ range }}
          </button>
        </div>
      </div>

      <!-- Activity Charts -->
      <div class="space-y-3">
        <!-- Combined Activity Chart -->
        <div class="relative h-24">
          <canvas 
            ref="combinedCanvas" 
            :width="chartWidth" 
            :height="96"
            class="w-full h-full"
          />
          <div v-if="!hasActivity" class="absolute inset-0 flex items-center justify-center">
            <div class="text-xs text-muted-foreground">Waiting for activity...</div>
          </div>
        </div>
        
        <!-- Activity Stats -->
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/30 rounded-lg p-2">
            <div class="text-lg font-bold text-blue-600">{{ currentEventRate }}</div>
            <div class="text-[10px] text-muted-foreground">Events/min</div>
          </div>
          <div class="bg-muted/30 rounded-lg p-2">
            <div class="text-lg font-bold text-purple-600">{{ activeSessionsCount || 0 }}</div>
            <div class="text-[10px] text-muted-foreground">Active Sessions</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Glow effect overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[var(--theme-primary)]/5 pointer-events-none"></div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import type { HookEvent, TimeRange } from '~/types'

const props = defineProps<{
  events: HookEvent[]
  filters: {
    sessionId: string
    eventType: string
  }
  timelineScroll?: number
  wsConnection?: WebSocket | null
  activeSessionsCount?: number
}>()

// State
const timeRanges: TimeRange[] = ['15s', '30s', '1m', '3m', '5m']
const timeRange = ref<TimeRange>('1m')
const combinedCanvas = ref<HTMLCanvasElement>()
const chartWidth = ref(280)

// Activity tracking
const eventHistory = ref<number[]>([])
const tokenHistory = ref<number[]>([])
const currentEventRate = ref(0)
const currentTokenRate = ref(0)
const totalTokens = ref(0)

// Chart update
let updateInterval: number | null = null
let resizeObserver: ResizeObserver | null = null

// Computed
const hasActivity = computed(() => props.events.length > 0 || totalTokens.value > 0)

const totalEvents = computed(() => {
  return props.events.length
})

const activityStatus = computed(() => {
  const eventRate = currentEventRate.value
  const tokenRate = currentTokenRate.value
  
  if (eventRate === 0 && tokenRate === 0) return 'Idle'
  if (eventRate < 5 && tokenRate < 1000) return 'Low'
  if (eventRate < 15 && tokenRate < 5000) return 'Medium'
  if (eventRate < 30 && tokenRate < 10000) return 'High'
  return 'Very High'
})

const activityStatusClass = computed(() => {
  const status = activityStatus.value
  if (status === 'Idle') return 'text-gray-600 border-gray-300'
  if (status === 'Low') return 'text-green-600 border-green-300'
  if (status === 'Medium') return 'text-yellow-600 border-yellow-300'
  if (status === 'High') return 'text-orange-600 border-orange-300'
  return 'text-red-600 border-red-300'
})

const tokenRateColorClass = computed(() => {
  if (currentTokenRate.value === 0) return 'text-gray-500'
  if (currentTokenRate.value < 1000) return 'text-green-600'
  if (currentTokenRate.value < 5000) return 'text-yellow-600'
  if (currentTokenRate.value < 10000) return 'text-orange-600'
  return 'text-red-600'
})

// Chart data processing
const getTimeRangeMs = (range: TimeRange): number => {
  const rangeMap = {
    '15s': 15 * 1000,
    '30s': 30 * 1000, 
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000
  }
  return rangeMap[range]
}

const calculateEventRate = (): number => {
  const now = Date.now()
  const timeRangeMs = getTimeRangeMs(timeRange.value)
  const startTime = now - timeRangeMs
  
  const recentEvents = props.events.filter(event => 
    (event.timestamp || 0) >= startTime
  )
  
  // Convert to events per minute
  return Math.round((recentEvents.length / timeRangeMs) * 60 * 1000)
}

const updateActivityData = () => {
  // Calculate current event rate
  currentEventRate.value = calculateEventRate()
  
  // Add to history (keep last 60 data points)
  eventHistory.value.push(currentEventRate.value)
  if (eventHistory.value.length > 60) {
    eventHistory.value.shift()
  }
  
  // Token rate will be updated by WebSocket
  tokenHistory.value.push(currentTokenRate.value)
  if (tokenHistory.value.length > 60) {
    tokenHistory.value.shift()
  }
  
  // Redraw chart
  drawCombinedChart()
}

const drawCombinedChart = () => {
  const canvas = combinedCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvas.width
  const height = canvas.height
  const padding = 10
  const chartWidth = width - (padding * 2)
  const chartHeight = height - (padding * 2)
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
  ctx.fillRect(0, 0, width, height)
  
  if (eventHistory.value.length < 2 && tokenHistory.value.length < 2) return
  
  // Find max values for scaling
  const maxEventRate = Math.max(...eventHistory.value, 1)
  const maxTokenRate = Math.max(...tokenHistory.value, 1)
  
  // Draw event rate line (blue)
  if (eventHistory.value.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = 'rgb(59, 130, 246)'
    ctx.lineWidth = 2
    
    eventHistory.value.forEach((rate, index) => {
      const x = padding + (index / (eventHistory.value.length - 1)) * chartWidth
      const y = padding + chartHeight - (rate / maxEventRate) * (chartHeight * 0.4) // Use top 40% of chart
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // Fill area under event line
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.lineTo(padding, padding + chartHeight)
    ctx.closePath()
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.fill()
  }
  
  // Draw token rate line (orange)
  if (tokenHistory.value.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = 'rgb(249, 115, 22)'
    ctx.lineWidth = 2
    
    tokenHistory.value.forEach((rate, index) => {
      const x = padding + (index / (tokenHistory.value.length - 1)) * chartWidth
      const y = padding + chartHeight * 0.6 - (rate / maxTokenRate) * (chartHeight * 0.4) // Use bottom 40% of chart
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // Fill area under token line  
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.lineTo(padding, padding + chartHeight * 0.6)
    ctx.closePath()
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'
    ctx.fill()
  }
  
  // Draw divider line between event and token sections
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.moveTo(padding, padding + chartHeight * 0.5)
  ctx.lineTo(padding + chartWidth, padding + chartHeight * 0.5)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Draw labels
  ctx.fillStyle = 'rgba(107, 114, 128, 0.8)'
  ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Events', padding + 5, padding + 15)
  ctx.fillText('Tokens', padding + 5, padding + chartHeight * 0.65)
}

// Use centralized formatters
import { formatNumber } from '~/utils/formatters';

const setTimeRange = (range: TimeRange) => {
  timeRange.value = range
  // Clear history to avoid scale issues
  eventHistory.value = []
  tokenHistory.value = []
}

// Handle WebSocket token updates (using ccusage data like the modal)
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data)
    if (data.type === 'tokenUsage' && data.data) {
      const usage = data.data
      
      // Use ccusage's pre-calculated total tokens
      if (usage.totalTokens !== undefined) {
        totalTokens.value = usage.totalTokens
      } else if (usage.tokenCounts) {
        totalTokens.value = (usage.tokenCounts.inputTokens || 0) + 
                           (usage.tokenCounts.outputTokens || 0) + 
                           (usage.tokenCounts.cacheCreationInputTokens || 0) + 
                           (usage.tokenCounts.cacheReadInputTokens || 0)
      }
      
      // Use ccusage's pre-calculated burn rate instead of manual calculation
      const burnRate = usage.burnRate?.tokensPerMinute || 0
      currentTokenRate.value = Math.round(burnRate)
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

const setupResizeObserver = () => {
  if (!combinedCanvas.value?.parentElement) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width } = entry.contentRect
      chartWidth.value = Math.floor(width * 0.9) // Account for padding
      nextTick(() => {
        drawCombinedChart()
      })
    }
  })
  
  resizeObserver.observe(combinedCanvas.value.parentElement)
}

// Watch for events changes to update event rate
watch(() => props.events.length, () => {
  updateActivityData()
})

onMounted(() => {
  // Set up periodic updates
  updateInterval = window.setInterval(updateActivityData, 2000) // Update every 2 seconds
  
  // Listen for WebSocket updates
  if (props.wsConnection) {
    props.wsConnection.addEventListener('message', handleWebSocketMessage)
  }
  
  // Set up resize observer
  nextTick(() => {
    setupResizeObserver()
    drawCombinedChart()
  })
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  if (props.wsConnection) {
    props.wsConnection.removeEventListener('message', handleWebSocketMessage)
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>