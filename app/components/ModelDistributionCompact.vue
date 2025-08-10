<template>
  <Card v-if="modelStats.length > 0" class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold flex items-center gap-2 text-sm">
        <Cpu class="w-4 h-4" />
        Model Distribution
      </h3>
      <Badge variant="outline" class="text-xs">
        {{ uniqueModels.length }} {{ uniqueModels.length === 1 ? 'model' : 'models' }}
      </Badge>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Compact Chart -->
      <ClientOnly>
        <div class="relative flex justify-center">
          <canvas 
            ref="modelChartCanvas" 
            :width="CHART_DIMENSIONS.COMPACT.width" 
            :height="CHART_DIMENSIONS.COMPACT.height"
            class="w-40 h-40"
          />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div class="text-xl font-bold text-foreground">{{ uniqueModels.length }}</div>
            <div class="text-[10px] text-muted-foreground uppercase tracking-wide">
              {{ uniqueModels.length === 1 ? 'Model' : 'Models' }}
            </div>
          </div>
        </div>
      </ClientOnly>
      
      <!-- Compact Model List -->
      <div class="space-y-2">
        <div
          v-for="(model, index) in modelStats.slice(0, 3)"
          :key="model.name"
          class="flex items-center justify-between p-2 rounded bg-muted/20"
        >
          <div class="flex items-center gap-2">
            <div 
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }"
            />
            <div class="text-xs font-medium">{{ formatModelName(model.name) }}</div>
          </div>
          <div class="text-xs font-semibold">{{ model.usage }}%</div>
        </div>
        
        <div v-if="modelStats.length > 3" class="text-center">
          <Badge variant="secondary" class="text-xs">
            +{{ modelStats.length - 3 }} more
          </Badge>
        </div>
        
        <div class="text-center pt-1">
          <div class="text-xs text-muted-foreground">Primary: {{ formatModelName(mostUsedModel) }}</div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Cpu } from 'lucide-vue-next'
// Use shared constants
import { CHART_COLORS, CHART_DIMENSIONS } from '~/constants/tokenUsage'
import { formatModelName } from '~/utils/formatters'

interface ModelStat {
  name: string
  count: number
  usage: number
}

const props = defineProps<{
  modelStats: ModelStat[]
}>()

// Canvas ref
const modelChartCanvas = ref<HTMLCanvasElement>()

// Computed properties
const uniqueModels = computed(() => {
  return props.modelStats.map(stat => stat.name)
})

const mostUsedModel = computed(() => {
  if (props.modelStats.length === 0) return 'None'
  return props.modelStats[0]?.name || 'Unknown'
})

// Draw compact model distribution chart
const drawModelChart = () => {
  const canvas = modelChartCanvas.value
  if (!canvas || uniqueModels.value.length === 0) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 10
  const innerRadius = radius * 0.65
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Calculate angles
  let currentAngle = -Math.PI / 2 // Start from top
  
  props.modelStats.forEach((model, index) => {
    const sliceAngle = (model.usage / 100) * 2 * Math.PI
    const color = CHART_COLORS[index % CHART_COLORS.length] || '#8b5cf6'
    
    // Draw slice
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    
    // Draw subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    currentAngle += sliceAngle
  })
}

// Watch for model stats changes and redraw
watch(() => props.modelStats, () => {
  nextTick(() => {
    drawModelChart()
  })
}, { deep: true })

// Initial draw on mount
nextTick(() => {
  drawModelChart()
})
</script>