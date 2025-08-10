<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Total Tokens -->
    <Card class="p-5 hover:shadow-md transition-shadow duration-200">
      <div class="text-center space-y-3">
        <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full w-10 h-10 mx-auto flex items-center justify-center">
          <Cpu class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="space-y-1">
          <div class="text-2xl font-bold">{{ formatLargeNumber(tokenData.totalTokens) }}</div>
          <div class="text-sm text-muted-foreground font-medium">Total Tokens</div>
          <div class="text-xs text-muted-foreground">This Session</div>
        </div>
      </div>
    </Card>
    
    <!-- Session Cost -->
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
    
    <!-- Burn Rate -->
    <Card class="p-5 hover:shadow-md transition-shadow duration-200">
      <div class="text-center space-y-3">
        <div class="p-2 rounded-full w-10 h-10 mx-auto flex items-center justify-center" :class="burnRateIconClass">
          <Zap class="w-5 h-5" :class="burnRateColorClass" />
        </div>
        <div class="space-y-1">
          <div class="text-2xl font-bold" :class="burnRateColorClass">{{ formatLargeNumber(currentBurnRate) }}</div>
          <div class="text-sm text-muted-foreground font-medium">Burn Rate</div>
          <div class="text-xs text-muted-foreground">tokens/min</div>
        </div>
        <!-- Activity Level Badge integrated here -->
        <div class="pt-2">
          <Badge :class="activityBadgeClass" class="text-sm px-3 py-1">
            <div v-if="tokenData.isActive" class="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
            {{ activityLevel }}
          </Badge>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Zap, DollarSign, Cpu, TrendingUp } from 'lucide-vue-next'
// Use shared utilities
import { formatLargeNumber } from '~/utils/formatters'
import { getActivityLevel, getActivityColorClass, type TokenUsageData } from '~/utils/tokenUsage'

const props = defineProps<{
  tokenData: TokenUsageData
  currentBurnRate: number
  hourlyRate: string
  projection?: any | null
}>()

// Activity level based on burn rate
const activityLevel = computed(() => {
  return getActivityLevel(props.currentBurnRate)
})

// Activity badge styling
const activityBadgeClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'badge')
})

// Burn rate color
const burnRateColorClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'text')
})

// Burn rate icon background color
const burnRateIconClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'icon')
})
</script>