<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-background border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-lg bg-primary/10">
            <Zap class="w-5 h-5 text-primary" />
          </div>
          <div class="space-y-1">
            <h2 class="text-xl font-semibold">Token Usage Details</h2>
            <p class="text-sm text-muted-foreground">Comprehensive session monitoring and analytics</p>
          </div>
          <!-- Session Metadata -->
          <div v-if="tokenData" class="flex items-center gap-4 ml-6 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full" :class="tokenData.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'"></div>
              <span class="font-medium">{{ tokenData.isActive ? 'Active' : 'Completed' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              <span>{{ formatTime(tokenData.startTime) }}</span>
            </div>
            <div v-if="tokenData.isActive" class="flex items-center gap-1">
              <span class="font-mono text-primary">{{ formatDuration(tokenData.startTime) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="font-mono text-xs bg-muted px-2 py-1 rounded">{{ tokenData.id.slice(0, 8) }}...</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" @click="$emit('close')">
          <X class="w-4 h-4" />
        </Button>
      </div>

      <div v-if="!tokenData" class="p-8 text-center text-muted-foreground">
        <Loader2 v-if="loading" class="w-8 h-8 animate-spin mx-auto mb-3" />
        <div v-else class="space-y-2">
          <Pause class="w-8 h-8 mx-auto" />
          <p class="text-lg font-medium">No Active Session</p>
          <p class="text-sm">Start a Claude conversation to begin monitoring token usage</p>
        </div>
      </div>

      <div v-else class="p-6 space-y-5">
        <!-- Session Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card class="p-5 hover:shadow-md transition-shadow duration-200">
            <div class="text-center space-y-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full w-10 h-10 mx-auto flex items-center justify-center">
                <Cpu class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="space-y-1">
                <div class="text-2xl font-bold">{{ formatNumber(tokenData.totalTokens) }}</div>
                <div class="text-sm text-muted-foreground font-medium">Total Tokens</div>
                <div class="text-xs text-muted-foreground">This Session</div>
              </div>
            </div>
          </Card>
          
          <Card class="p-5 hover:shadow-md transition-shadow duration-200">
            <div class="text-center space-y-3">
              <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-full w-10 h-10 mx-auto flex items-center justify-center">
                <DollarSign class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="space-y-1">
                <div class="text-2xl font-bold text-green-600">${{ tokenData.costUSD.toFixed(4) }}</div>
                <div class="text-sm text-muted-foreground font-medium">Session Cost</div>
                <div class="text-xs text-muted-foreground">USD</div>
              </div>
              <!-- Cost Analysis Tags -->
              <div class="pt-2 space-y-2">
                <div class="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" class="text-xs px-2 py-1">
                    <DollarSign class="w-3 h-3 mr-1" />
                    ${{ hourlyRate }}/hr
                  </Badge>
                  <Badge variant="outline" class="text-xs px-2 py-1">
                    <Cpu class="w-3 h-3 mr-1" />
                    ${{ ((tokenData.costUSD / tokenData.totalTokens) * 1000).toFixed(4) }}/1K
                  </Badge>
                </div>
                <div v-if="tokenData.isActive && projection" class="text-center">
                  <Badge variant="secondary" class="text-xs px-2 py-1">
                    <TrendingUp class="w-3 h-3 mr-1" />
                    ~${{ projection.cost.toFixed(2) }} projected
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
          
          <Card class="p-5 hover:shadow-md transition-shadow duration-200">
            <div class="text-center space-y-3">
              <div class="p-2 rounded-full w-10 h-10 mx-auto flex items-center justify-center" :class="burnRateIconClass">
                <Zap class="w-5 h-5" :class="burnRateColorClass" />
              </div>
              <div class="space-y-1">
                <div class="text-2xl font-bold" :class="burnRateColorClass">{{ formatNumber(currentBurnRate) }}</div>
                <div class="text-sm text-muted-foreground font-medium">Burn Rate</div>
                <div class="text-xs text-muted-foreground">tokens/min</div>
              </div>
              <!-- Activity Level Badge integrated here -->
              <div class="pt-2">
                <Badge :class="activityClass" class="text-sm px-3 py-1">
                  <div v-if="tokenData.isActive" class="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
                  {{ activityLevel }}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <!-- Token Breakdown -->
        <Card class="p-5 space-y-4">
          <h3 class="font-semibold flex items-center gap-2 text-base">
            <Layers class="w-4 h-4" />
            Token Breakdown
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30 hover:shadow-sm transition-shadow">
              <div class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(tokenData.tokenCounts.inputTokens) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Input Tokens</div>
            </div>
            <div class="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30 hover:shadow-sm transition-shadow">
              <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatNumber(tokenData.tokenCounts.outputTokens) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Output Tokens</div>
            </div>
            <div v-if="tokenData.tokenCounts.cacheCreationInputTokens > 0" class="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30 hover:shadow-sm transition-shadow">
              <div class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ formatNumber(tokenData.tokenCounts.cacheCreationInputTokens) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Cache Creation</div>
            </div>
            <div v-if="tokenData.tokenCounts.cacheReadInputTokens > 0" class="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800/30 hover:shadow-sm transition-shadow">
              <div class="text-xl font-bold text-orange-600 dark:text-orange-400">{{ formatNumber(tokenData.tokenCounts.cacheReadInputTokens) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Cache Read</div>
            </div>
          </div>
        </Card>

        <!-- Live Activity Monitor (using shared component) -->
        <div class="space-y-3">
          <LiveActivityMonitor 
            :events="[]" 
            :filters="{ sessionId: '', eventType: '' }"
            :ws-connection="wsConnection"
          />
        </div>

        <!-- Model Distribution Chart (Compact) -->
        <Card v-if="tokenData.models.length > 0" class="p-4 space-y-3">
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
                  width="160" 
                  height="160"
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
                    :style="{ backgroundColor: modelChartColors[index % modelChartColors.length] }"
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

        <!-- Block Projection -->
        <Card v-if="tokenData.isActive && projection" class="p-5 space-y-4 bg-gradient-to-br from-background to-muted/20">
          <h3 class="font-semibold flex items-center gap-2 text-base">
            <Calendar class="w-4 h-4" />
            5-Hour Block Projection
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
              <div class="text-lg font-bold">{{ formatNumber(projection.tokens) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Projected Tokens</div>
            </div>
            <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
              <div class="text-lg font-bold text-green-600">${{ projection.cost.toFixed(2) }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Projected Cost</div>
            </div>
            <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
              <div class="text-lg font-bold text-blue-600">{{ projection.timeRemaining }}</div>
              <div class="text-xs text-muted-foreground font-medium mt-1">Time Remaining</div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="space-y-3">
            <div class="flex justify-between text-sm font-medium">
              <span class="text-muted-foreground">Block Progress</span>
              <span class="text-primary">{{ getBlockPercentage() }}%</span>
            </div>
            <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-700 ease-out relative"
                :style="{ width: `${getBlockPercentage()}%` }"
              >
                <div class="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>
            <div class="text-xs text-muted-foreground text-center opacity-75">
              {{ Math.floor((5 * 60 * getBlockPercentage()) / 100) }} minutes elapsed of 300 minute block
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { 
  Zap, X, Clock, BarChart3, Layers, Gauge, TrendingUp, 
  DollarSign, Cpu, Calendar, Loader2, Pause 
} from 'lucide-vue-next'
import LiveActivityMonitor from './LiveActivityMonitor.vue'

interface TokenUsageData {
  id: string
  startTime: string
  endTime?: string
  actualEndTime?: string
  isActive: boolean
  isGap?: boolean
  entries?: number | any[]
  tokenCounts: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  }
  totalTokens: number
  costUSD: number
  models: string[]
  burnRate: number | null
  projection?: any | null
}

const props = defineProps<{
  wsConnection?: { value: WebSocket | null }
}>()

// Create a reactive wsConnection object for the LiveActivityMonitor
const wsConnection = computed(() => props.wsConnection)

defineEmits<{
  close: []
}>()

// State
const tokenData = ref<TokenUsageData | null>(null)
const loading = ref(true)
const updateInterval = ref<number | null>(null)

// Live monitoring state
const isActive = ref(false)
const currentBurnRate = ref(0)
const avgBurnRate = ref(0)
const peakBurnRate = ref(0)
const hourlyRate = ref('0.00')
const activityHistory = ref<number[]>([])
const projection = ref<any>(null)
const lastUpdateTime = ref('--:--')
const uniqueModels = ref<string[]>([])
const modelStats = ref<Array<{name: string, count: number, usage: number}>>([])
const modelChartColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

// Canvas refs
const modelChartCanvas = ref<HTMLCanvasElement>()

// Transform ccusage SessionBlock format to our interface
const transformSessionBlock = (block: any): TokenUsageData | null => {
  if (!block) return null
  
  // Use ccusage's pre-calculated aggregated data (don't recalculate!)
  const tokenCounts = block.tokenCounts || {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0
  }
  
  // Use ccusage's pre-calculated total tokens and cost
  const totalTokens = block.totalTokens || (
    tokenCounts.inputTokens + tokenCounts.outputTokens + 
    tokenCounts.cacheCreationInputTokens + tokenCounts.cacheReadInputTokens
  )
  
  // Use ccusage's pre-calculated cost (don't sum from entries)
  const totalCost = block.costUSD || 0
  
  // Use ccusage's models array (don't extract from entries)
  const models = block.models || []
  
  // Extract burn rate from ccusage's burnRate object
  const burnRatePerMinute = block.burnRate?.tokensPerMinute || 0
  
  return {
    id: block.id,
    startTime: block.startTime,
    endTime: block.endTime,
    actualEndTime: block.actualEndTime,
    isActive: block.isActive,
    isGap: block.isGap,
    entries: Array.isArray(block.entries) ? block.entries.length : (block.entries || 0),
    tokenCounts,
    totalTokens,
    costUSD: totalCost,
    models: Array.from(models),
    burnRate: burnRatePerMinute,
    projection: block.projection || null
  }
}

// Computed
const activityLevel = computed(() => {
  if (currentBurnRate.value === 0) return 'Idle'
  if (currentBurnRate.value < 1000) return 'Low'
  if (currentBurnRate.value < 10000) return 'Medium'
  if (currentBurnRate.value < 50000) return 'High'
  return 'Very High'
})

const activityClass = computed(() => {
  const level = activityLevel.value
  if (level === 'Idle') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  if (level === 'Low') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  if (level === 'Medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  if (level === 'High') return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
})

const burnRateColorClass = computed(() => {
  const level = activityLevel.value
  if (level === 'Idle') return 'text-gray-500'
  if (level === 'Low') return 'text-green-600 dark:text-green-400'
  if (level === 'Medium') return 'text-yellow-600 dark:text-yellow-400'
  if (level === 'High') return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
})

const burnRateIconClass = computed(() => {
  const level = activityLevel.value
  if (level === 'Idle') return 'bg-gray-100 dark:bg-gray-800'
  if (level === 'Low') return 'bg-green-100 dark:bg-green-900/30'
  if (level === 'Medium') return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (level === 'High') return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
})

const mostUsedModel = computed(() => {
  if (modelStats.value.length === 0) return 'None'
  return modelStats.value[0].name
})

// Format functions
const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return Math.round(num).toLocaleString()
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatDuration = (startTime: string): string => {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const duration = Math.floor((now - start) / 1000)
  
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

const formatModelName = (model: string): string => {
  const parts = model.split('-')
  if (parts.length > 3) {
    return parts.slice(0, 3).join('-')
  }
  return model
}

const getBlockPercentage = (): number => {
  if (!tokenData.value?.isActive || !tokenData.value?.startTime) return 0
  
  try {
    const start = new Date(tokenData.value.startTime).getTime()
    if (isNaN(start)) return 0
    
    const now = Date.now()
    const elapsed = now - start
    const blockDuration = 5 * 60 * 60 * 1000 // 5 hours in ms
    
    return Math.min(100, Math.round((elapsed / blockDuration) * 100))
  } catch {
    return 0
  }
}

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
  
  modelStats.value.forEach((model, index) => {
    const sliceAngle = (model.usage / 100) * 2 * Math.PI
    const color = modelChartColors[index % modelChartColors.length]
    
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

// Handle WebSocket updates
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data)
    if (data.type === 'tokenUsage' && data.data) {
      const usage = data.data
      tokenData.value = transformSessionBlock(usage)
      
      isActive.value = usage.isActive
      
      // Use ccusage's pre-calculated burn rate instead of manual calculation
      const burnRate = usage.burnRate?.tokensPerMinute || 0
      
      currentBurnRate.value = Math.round(burnRate)
      
      // Update last update time
      lastUpdateTime.value = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // Update history with real-time data
      activityHistory.value.push(burnRate)
      if (activityHistory.value.length > 60) {
        activityHistory.value.shift()
      }
      
      // Update model statistics
      if (usage.models && usage.models.length > 0) {
        const modelCounts = new Map<string, number>()
        usage.models.forEach((model: string) => {
          modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
        })
        
        const total = usage.models.length
        uniqueModels.value = Array.from(modelCounts.keys())
        modelStats.value = Array.from(modelCounts.entries())
          .map(([name, count]) => ({
            name,
            count,
            usage: Math.round((count / total) * 100)
          }))
          .sort((a, b) => b.count - a.count)
      }
      
      // Update statistics
      if (burnRate > peakBurnRate.value) {
        peakBurnRate.value = Math.round(burnRate)
      }
      
      if (activityHistory.value.length > 0) {
        const sum = activityHistory.value.reduce((a, b) => a + b, 0)
        avgBurnRate.value = Math.round(sum / activityHistory.value.length)
      }
      
      // Use ccusage's cost per hour calculation
      if (usage.burnRate?.costPerHour) {
        hourlyRate.value = usage.burnRate.costPerHour.toFixed(2)
      } else {
        hourlyRate.value = '0.00'
      }
      
      // Use ccusage's projection if available
      if (usage.projection) {
        const proj = usage.projection
        projection.value = {
          tokens: proj.totalTokens || 0,
          cost: proj.totalCost || 0,
          timeRemaining: `${Math.floor(proj.remainingMinutes / 60)}h ${proj.remainingMinutes % 60}m`
        }
      }
      
      loading.value = false
      
      // Trigger chart updates
      nextTick(() => {
        drawModelChart()
      })
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

// Fetch initial data
const fetchTokenData = async () => {
  const { apiUrl } = useServerConfig();
  try {
    const response = await fetch(apiUrl('/usage/blocks/live'))
    const result = await response.json()
    
    if (result.success && result.data) {
      handleWebSocketMessage(new MessageEvent('message', {
        data: JSON.stringify({ type: 'tokenUsage', data: result.data })
      }))
    } else {
      tokenData.value = null
      loading.value = false
    }
  } catch (error) {
    console.error('Error fetching token data:', error)
    tokenData.value = null
    loading.value = false
  }
}

onMounted(() => {
  // Initial fetch
  fetchTokenData()
  
  // Listen for WebSocket updates if available
  if (props.wsConnection?.value) {
    props.wsConnection.value.addEventListener('message', handleWebSocketMessage)
  }
  
  // Update duration display every second for active sessions
  updateInterval.value = window.setInterval(() => {
    if (tokenData.value?.isActive) {
      // Force re-render to update duration
      tokenData.value = { ...tokenData.value }
    }
  }, 1000)
  
  // Initial canvas draw
  nextTick(() => {
    drawModelChart()
  })
})

onUnmounted(() => {
  if (props.wsConnection?.value) {
    props.wsConnection.value.removeEventListener('message', handleWebSocketMessage)
  }
  
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>