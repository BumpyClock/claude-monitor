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
        <TokenUsageStats 
          :token-data="tokenData"
          :current-burn-rate="currentBurnRate"
          :hourly-rate="hourlyRate"
          :projection="projection"
        />

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
        <ModelDistributionCompact 
          v-if="tokenData.models.length > 0"
          :model-stats="modelStats"
        />

        <!-- Block Projection -->
        <BlockProjection 
          :token-data="tokenData"
          :projection="projection"
        />
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
  Zap, X, Clock, Layers, Loader2, Pause 
} from 'lucide-vue-next'
import LiveActivityMonitor from './LiveActivityMonitor.vue'
import TokenUsageStats from './TokenUsageStats.vue'
import ModelDistributionCompact from './ModelDistributionCompact.vue'
import BlockProjection from './BlockProjection.vue'

// Use shared types
import { transformSessionBlock, parseWebSocketMessage, type TokenUsageData } from '~/utils/tokenUsage'
import { formatNumber, formatTime, formatDurationFromStart as formatDuration } from '~/utils/formatters'

const props = defineProps<{
  wsConnection?: WebSocket | null
}>()

// Pass wsConnection directly to LiveActivityMonitor
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

// transformSessionBlock function now imported from shared utilities

// Computed values moved to sub-components

// Utility functions moved to sub-components and shared utilities

// Handle WebSocket updates
const handleWebSocketMessage = (event: MessageEvent) => {
  const parsedData = parseWebSocketMessage(event)
  if (parsedData) {
    tokenData.value = parsedData
    
    // Update live monitoring state
    isActive.value = parsedData.isActive
    currentBurnRate.value = Math.round(parsedData.burnRate || 0)
    
    // Update last update time
    lastUpdateTime.value = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Update history with real-time data
    activityHistory.value.push(parsedData.burnRate || 0)
    if (activityHistory.value.length > 60) {
      activityHistory.value.shift()
    }
    
    // Update model statistics
    if (parsedData.models && parsedData.models.length > 0) {
      const modelCounts = new Map<string, number>()
      parsedData.models.forEach((model: string) => {
        modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
      })
      
      const total = parsedData.models.length
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
    const burnRate = parsedData.burnRate || 0
    if (burnRate > peakBurnRate.value) {
      peakBurnRate.value = Math.round(burnRate)
    }
    
    if (activityHistory.value.length > 0) {
      const sum = activityHistory.value.reduce((a, b) => a + b, 0)
      avgBurnRate.value = Math.round(sum / activityHistory.value.length)
    }
    
    // Extract hourly rate and projection from the raw data if needed
    try {
      const data = JSON.parse(event.data)
      if (data.data?.burnRate?.costPerHour) {
        hourlyRate.value = data.data.burnRate.costPerHour.toFixed(2)
      }
      
      if (data.data?.projection) {
        const proj = data.data.projection
        projection.value = {
          tokens: proj.totalTokens || 0,
          cost: proj.totalCost || 0,
          timeRemaining: `${Math.floor(proj.remainingMinutes / 60)}h ${proj.remainingMinutes % 60}m`
        }
      }
    } catch (error) {
      console.error('Error extracting additional data:', error)
    }
    
    loading.value = false
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
  if (props.wsConnection) {
    props.wsConnection.addEventListener('message', handleWebSocketMessage)
  }
  
  // Update duration display every second for active sessions
  updateInterval.value = window.setInterval(() => {
    if (tokenData.value?.isActive) {
      // Force re-render to update duration
      tokenData.value = { ...tokenData.value }
    }
  }, 1000)
  
  // Sub-components handle their own canvas drawing
})

onUnmounted(() => {
  if (props.wsConnection) {
    props.wsConnection.removeEventListener('message', handleWebSocketMessage)
  }
  
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>