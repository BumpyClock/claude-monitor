<template>
  <div class="bg-gradient-to-r from-background/95 to-secondary/95 backdrop-blur-sm px-2 sm:px-3 py-2 border-b border-border/20">
    <div class="flex items-center justify-between mb-2 sm:mb-3 mobile:flex-col mobile:space-y-2 mobile:items-start">
      <h3 class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></span>
        <span class="hidden xs:inline">Live Activity</span>
        <span class="xs:hidden">Live</span>
      </h3>
      <div class="flex gap-0.5 sm:gap-1 mobile:w-full mobile:justify-center" role="tablist" aria-label="Time range selector">
        <button
          v-for="(range, index) in timeRanges"
          :key="range"
          @click="setTimeRange(range)"
          @keydown="handleTimeRangeKeyDown($event, index)"
          :class="[
            'px-1.5 sm:px-2 py-0.5 text-xs rounded-md transition-all duration-150 min-w-[24px] sm:min-w-[28px] min-h-[20px] sm:min-h-[24px] flex items-center justify-center border shadow-sm touch-manipulation',
            timeRange === range
              ? 'bg-gradient-to-r from-primary to-primary text-primary-foreground border-primary shadow-md scale-105'
              : 'bg-secondary/80 text-foreground border-border/30 hover:bg-muted active:scale-95 sm:hover:scale-105 sm:hover:shadow-md'
          ]"
          role="tab"
          :aria-selected="timeRange === range"
          :aria-label="`Show ${range}`"
          :tabindex="timeRange === range ? 0 : -1"
        >
          {{ range }}
        </button>
      </div>
    </div>
    <div class="relative transition-transform will-change-transform overflow-hidden"
         :style="{ 
           transform: `translate3d(-${(timelineScroll || 0) * 0.05}px, 0, 0)`
         }"
    >
      <ClientOnly>
        <div v-if="hasData && chartData.length > 0" class="h-[100px] sm:h-[120px] md:h-[140px] w-full overflow-hidden">
          <!-- Simple line chart implementation -->
          <canvas 
            ref="chartCanvas" 
            :width="chartWidth" 
            :height="chartHeight"
            class="w-full h-full"
          />
        </div>
      </ClientOnly>
      <div
        v-if="!hasData"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2 animate-fadeIn">
          <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-border/30 border-t-primary animate-spin"></div>
          <p class="text-muted-foreground text-xs font-medium hidden sm:block">Waiting for events...</p>
          <p class="text-muted-foreground text-xs font-medium sm:hidden">Waiting...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

// Simple interface for hook events - adjust as needed for your types
interface HookEvent {
  timestamp: number
  source_app: string
  hook_event_type: string
}

type TimeRange = '15s' | '30s' | '1m' | '3m' | '5m'

const props = defineProps<{
  events: HookEvent[]
  filters: {
    sessionId: string
    eventType: string
  }
  timelineScroll?: number
}>()

const timeRanges: TimeRange[] = ['15s', '30s', '1m', '3m', '5m']
const timeRange = ref<TimeRange>('1m')

// Chart setup
const chartCanvas = ref<HTMLCanvasElement>()
const chartWidth = ref(800)
const chartHeight = ref(140)

// Events are already filtered by the parent component
const filteredEvents = computed(() => props.events)

// Generate colors for different apps
const projectColors = computed<Record<string, string>>(() => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ]
  const map: Record<string, string> = {}
  let colorIndex = 0
  
  for (const e of props.events) {
    const app = e.source_app || 'Unknown'
    if (!map[app]) {
      map[app] = colors[colorIndex % colors.length]
      colorIndex++
    }
  }
  return map
})

const seriesCategories = computed(() => {
  const set = new Set<string>()
  for (const e of filteredEvents.value) {
    set.add(e.source_app || 'Unknown')
  }
  return Array.from(set)
})

const chartData = computed(() => {
  const now = Date.now()
  const timeRangeMs = {
    '15s': 15 * 1000,
    '30s': 30 * 1000, 
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000
  }[timeRange.value]

  const startTime = now - timeRangeMs
  const recentEvents = filteredEvents.value.filter(event => 
    event.timestamp >= startTime
  )

  // Reduce data points on mobile for better performance
  const dataPoints = typeof window !== 'undefined' && window.innerWidth < 640 ? 15 : 20
  const intervalMs = timeRangeMs / dataPoints
  const intervals: Record<number, Record<string, number>> = {}

  for (let i = 0; i < dataPoints; i++) {
    const intervalStart = startTime + (i * intervalMs)
    intervals[intervalStart] = {}
  }

  recentEvents.forEach(event => {
    const eventTime = event.timestamp
    const intervalIndex = Math.floor((eventTime - startTime) / intervalMs)
    const intervalStart = startTime + (intervalIndex * intervalMs)
    const app = event.source_app || 'Unknown'
    if (intervals[intervalStart] !== undefined) {
      intervals[intervalStart][app] = (intervals[intervalStart][app] || 0) + 1
    }
  })

  return Object.entries(intervals).map(([time, counts]) => ({
    time: parseInt(time),
    timeLabel: new Date(parseInt(time)).toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' }),
    ...seriesCategories.value.reduce((acc, app) => { 
      acc[app] = counts[app] || 0
      return acc 
    }, {} as Record<string, number>)
  }))
})

const hasData = computed(() => props.events.length > 0)

// Time range selection
const setTimeRange = (range: TimeRange) => {
  timeRange.value = range
}

const handleTimeRangeKeyDown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowLeft' && index > 0) {
    timeRange.value = timeRanges[index - 1]
  } else if (event.key === 'ArrowRight' && index < timeRanges.length - 1) {
    timeRange.value = timeRanges[index + 1]
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    setTimeRange(timeRanges[index])
  }
}

// Simple canvas-based line chart
const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas || !chartData.value.length) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const padding = 20

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Find max value for scaling
  const maxValue = Math.max(
    ...chartData.value.flatMap(d => 
      seriesCategories.value.map(app => d[app] || 0)
    ),
    1
  )

  // Draw lines for each app
  seriesCategories.value.forEach((app, appIndex) => {
    const color = projectColors.value[app] || '#8b5cf6'
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    chartData.value.forEach((point, index) => {
      const x = padding + (index / (chartData.value.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point[app] || 0) / maxValue) * (height - 2 * padding)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = color
    chartData.value.forEach((point, index) => {
      const x = padding + (index / (chartData.value.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point[app] || 0) / maxValue) * (height - 2 * padding)
      
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, 2 * Math.PI)
      ctx.fill()
    })
  })
}

// Update canvas size
const updateCanvasSize = () => {
  if (typeof window === 'undefined') return
  
  const container = chartCanvas.value?.parentElement
  if (container) {
    chartWidth.value = container.clientWidth
    chartHeight.value = window.innerWidth < 640 ? 100 : window.innerWidth < 768 ? 120 : 140
  }
}

// Lifecycle hooks
onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  
  nextTick(() => {
    drawChart()
  })
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateCanvasSize)
  }
})

// Watch for data changes
watch([chartData, chartWidth, chartHeight], () => {
  nextTick(() => {
    drawChart()
  })
}, { deep: true })
</script>