<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="close"
    ></div>
    
    <!-- Modal -->
    <div 
      class="relative bg-background rounded-lg shadow-xl flex flex-col overflow-hidden z-10"
      style="width: 75vw; height: 75vh"
      @click.stop
    >
      <!-- Header -->
      <div class="flex-shrink-0 bg-background border-b p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-3xl font-semibold">
            🎨 Theme Manager
          </h2>
          <button
            @click="close"
            class="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-6 overflow-y-auto">
        <!-- Theme Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div
            v-for="theme in predefinedThemes"
            :key="theme.name"
            @click="selectTheme(theme.name)"
            :class="[
              'cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md',
              currentTheme === theme.name
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            ]"
          >
            <!-- Theme Preview -->
            <div class="flex h-16 rounded-md overflow-hidden mb-3">
              <div 
                class="flex-1"
                :style="{ backgroundColor: theme.preview.primary }"
              ></div>
              <div 
                class="flex-1"
                :style="{ backgroundColor: theme.preview.secondary }"
              ></div>
              <div 
                class="flex-1"
                :style="{ backgroundColor: theme.preview.accent }"
              ></div>
            </div>
            
            <!-- Theme Info -->
            <h3 class="font-medium">{{ theme.displayName }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ theme.description }}</p>
            
            <!-- Current indicator -->
            <div v-if="currentTheme === theme.name" class="mt-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Current
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-between items-center pt-4 border-t">
          <div class="text-sm text-muted-foreground">
            {{ predefinedThemes.length }} themes available
          </div>
          <button
            @click="close"
            class="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Mock theme data - in a real app this would come from a composable
const predefinedThemes = [
  {
    name: 'light',
    displayName: 'Light',
    description: 'Clean and bright theme for daylight use',
    preview: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      accent: '#007bff'
    }
  },
  {
    name: 'dark',
    displayName: 'Dark',
    description: 'Easy on the eyes for low-light environments',
    preview: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      accent: '#4a9eff'
    }
  },
  {
    name: 'system',
    displayName: 'System',
    description: 'Automatically matches your system preference',
    preview: {
      primary: '#ffffff',
      secondary: '#1a1a1a',
      accent: '#007bff'
    }
  }
]

// Mock current theme - in a real app this would come from a composable
const currentTheme = computed(() => 'light')

// Methods
const selectTheme = (themeName: string) => {
  // In a real app, this would call a composable method to set the theme
  console.log('Setting theme to:', themeName)
  close()
}

const close = () => {
  emit('close')
}
</script>