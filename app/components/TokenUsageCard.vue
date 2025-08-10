<template>
  <Card 
    class="p-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
    @click="$emit('openModal')"
    role="button"
    tabindex="0"
    @keydown.enter="$emit('openModal')"
    @keydown.space.prevent="$emit('openModal')"
  >
    <div v-if="!tokenData && loading" class="text-center py-6 text-muted-foreground">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
      <p class="text-sm">Loading...</p>
    </div>
    
    <div v-else-if="!tokenData" class="text-center py-6 text-muted-foreground">
      <Pause class="w-8 h-8 mx-auto mb-2" />
      <p class="text-sm">No Active Session</p>
      <p class="text-xs mt-1">Click to view details</p>
    </div>
    
    <div v-else class="space-y-3">
      <!-- Header with status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Zap class="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 class="font-semibold text-sm">Token Activity</h3>
            <p class="text-xs text-muted-foreground">{{ tokenData.isActive ? 'Active' : 'Completed' }}</p>
          </div>
        </div>
        
        <Badge :class="activityBadgeClass" variant="outline">
          {{ activityLevel }}
        </Badge>
      </div>
      
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Burn Rate -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold" :class="burnRateColorClass">{{ displayBurnRate }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Burn Rate</div>
        </div>
        
        <!-- Total Tokens -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold text-blue-600">{{ formatNumber(tokenData.totalTokens) }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Total Tokens</div>
        </div>
        
        <!-- Estimated Cost -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold text-green-600">${{ tokenData.costUSD.toFixed(3) }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Cost</div>
        </div>
        
        <!-- Tokens per Minute -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold" :class="tokensPerMinColorClass">{{ displayTokensPerMin }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Tokens/min</div>
        </div>
      </div>
      
      <!-- Progress indicator for active sessions -->
      <div v-if="tokenData.isActive" class="space-y-1">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Session Progress</span>
          <span>{{ getBlockPercentage() }}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-1.5">
          <div 
            class="bg-primary h-1.5 rounded-full transition-all duration-500"
            :style="{ width: `${getBlockPercentage()}%` }"
          />
        </div>
      </div>
      
      <!-- Click hint -->
      <div class="text-center pt-1">
        <p class="text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Click for detailed analytics
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Zap, Loader2, Pause } from 'lucide-vue-next'
// Use centralized formatters
import { formatNumber, formatTime, formatDurationFromStart as formatDuration, formatDurationShort } from '~/utils/formatters';

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
  wsConnection?: WebSocket | null // WebSocket connection from parent
}>()

defineEmits<{
  openModal: []
}>()

const tokenData = ref<TokenUsageData | null>(null)
const loading = ref(true)
const updateInterval = ref<number | null>(null)

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


// Format model name to be more readable
const formatModelName = (model: string): string => {
  // Extract the main model name (e.g., "claude-sonnet-4" from "claude-sonnet-4-20250514")
  const parts = model.split('-')
  if (parts.length > 3) {
    return parts.slice(0, 3).join('-')
  }
  return model
}

// Activity level based on burn rate
const activityLevel = computed(() => {
  if (!tokenData.value?.burnRate || tokenData.value.burnRate === 0) return 'Idle'
  const rate = tokenData.value.burnRate
  if (rate < 1000) return 'Low'
  if (rate < 10000) return 'Medium' 
  if (rate < 50000) return 'High'
  return 'Very High'
})

// Activity badge styling
const activityBadgeClass = computed(() => {
  const level = activityLevel.value
  if (level === 'Idle') return 'text-gray-600 border-gray-300'
  if (level === 'Low') return 'text-green-600 border-green-300'
  if (level === 'Medium') return 'text-yellow-600 border-yellow-300'
  if (level === 'High') return 'text-orange-600 border-orange-300'
  return 'text-red-600 border-red-300'
})

// Burn rate color
const burnRateColorClass = computed(() => {
  const level = activityLevel.value
  if (level === 'Idle') return 'text-gray-500'
  if (level === 'Low') return 'text-green-600'
  if (level === 'Medium') return 'text-yellow-600'
  if (level === 'High') return 'text-orange-600'
  return 'text-red-600'
})

// Display burn rate with appropriate formatting
const displayBurnRate = computed(() => {
  if (!tokenData.value?.burnRate || tokenData.value.burnRate === 0) return '0'
  const rate = tokenData.value.burnRate
  // Format large numbers appropriately
  if (rate >= 1000000) {
    return `${(rate / 1000000).toFixed(1)}M`
  } else if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}K`
  } else {
    return Math.round(rate).toString()
  }
})

// Display tokens per minute (same as burn rate since we're extracting tokensPerMinute)
const displayTokensPerMin = computed(() => {
  if (!tokenData.value?.burnRate || tokenData.value.burnRate === 0) return '0'
  const rate = tokenData.value.burnRate
  // Format large numbers appropriately
  if (rate >= 1000000) {
    return `${(rate / 1000000).toFixed(1)}M`
  } else if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}K`
  } else {
    return Math.round(rate).toString()
  }
})

// Tokens per minute color class
const tokensPerMinColorClass = computed(() => {
  if (!tokenData.value?.burnRate || tokenData.value.burnRate === 0) return 'text-gray-500'
  const rate = tokenData.value.burnRate
  if (rate < 1000) return 'text-green-600'
  if (rate < 10000) return 'text-yellow-600' 
  if (rate < 50000) return 'text-orange-600'
  return 'text-red-600'
})

// Calculate block percentage
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

// Fetch initial data
const fetchTokenData = async () => {
  const { apiUrl } = useServerConfig();
  try {
    const response = await fetch(apiUrl('/usage/blocks/live'))
    const result = await response.json()
    
    if (result.success && result.data) {
      tokenData.value = transformSessionBlock(result.data)
    } else {
      tokenData.value = null
    }
  } catch (error) {
    console.error('Error fetching token data:', error)
    tokenData.value = null
  } finally {
    loading.value = false
  }
}

// Handle WebSocket updates
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data)
    if (data.type === 'tokenUsage' && data.data) {
      tokenData.value = transformSessionBlock(data.data)
      loading.value = false
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
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