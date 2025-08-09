<template>
  <div class="min-h-screen h-full grid grid-rows-[auto,1fr] bg-[var(--theme-bg-secondary)] relative">
    <div class="absolute inset-0 pointer-events-none"></div>

    <header class="border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]">
      <div class="px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div class="sr-only">App header</div>
        
        <!-- Left side - Logo and Title -->
        <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[var(--theme-bg-tertiary)] flex items-center justify-center border border-[var(--theme-border-primary)]/40">
            <svg class="w-3 h-3 sm:w-4 sm:h-4 text-[var(--theme-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
          <h1 class="text-xs sm:text-sm font-semibold text-[var(--theme-text-secondary)] tracking-wide hidden xs:block">Claude Monitor</h1>
          <h1 class="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-wide xs:hidden">CM</h1>
        </div>

        <!-- Mobile Menu Button -->
        <Button
          variant="ghost"
          size="sm"
          class="md:hidden h-8 w-8 p-0"
          @click="showMobileMenu = !showMobileMenu"
        >
          <component :is="showMobileMenu ? X : Menu" class="h-4 w-4" />
        </Button>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-3">
          <!-- Add Project Button -->
          <Button
            size="sm"
            variant="outline"
            class="text-xs gap-1"
            @click="showHookInstaller = true"
          >
            <Plus class="w-3 h-3" />
            <span class="hidden lg:inline">Add Project</span>
          </Button>
          
          <!-- Desktop Filters -->
          <div class="flex items-center gap-2">
            <!-- Project Filter -->
            <Select v-model="localSelectedProject" @update:model-value="updateSelectedProject">
              <SelectTrigger class="h-8 text-xs w-[120px] lg:w-[140px] bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent class="bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40">
                <SelectItem value="__ALL__" class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                  <div class="flex items-center justify-between w-full">
                    <span>All Projects</span>
                    <Badge variant="secondary" class="ml-2">{{ totalFilteredCount }}</Badge>
                  </div>
                </SelectItem>
                <SelectSeparator />
                <SelectItem 
                  v-for="project in projectsWithCounts" 
                  :key="project.name" 
                  :value="project.name"
                  class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
                >
                  <div class="flex items-center justify-between w-full">
                    <span>{{ getDisplayName(project.name) }}</span>
                    <Badge variant="secondary" class="ml-2">{{ project.count }}</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <!-- Session Filter -->
            <Select v-model="filters.sessionId" @update:model-value="updateSessionId">
              <SelectTrigger class="h-8 text-xs w-[100px] lg:w-[120px] bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                <SelectValue placeholder="Sessions" />
              </SelectTrigger>
              <SelectContent class="bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40">
                <SelectItem value="__ALL_SESSIONS__" class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">All Sessions</SelectItem>
                <SelectSeparator />
                <SelectItem 
                  v-for="session in uniqueSessions" 
                  :key="session" 
                  :value="session"
                  class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
                >
                  {{ session.slice(0, 8) }}...
                </SelectItem>
              </SelectContent>
            </Select>
            
            <!-- Event Type Filter -->
            <Select v-model="filters.eventType" @update:model-value="updateEventType">
              <SelectTrigger class="h-8 text-xs w-[100px] lg:w-[120px] bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                <SelectValue placeholder="Types" />
              </SelectTrigger>
              <SelectContent class="bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40">
                <SelectItem value="__ALL_TYPES__" class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">All Types</SelectItem>
                <SelectSeparator />
                <SelectItem 
                  v-for="type in uniqueEventTypes" 
                  :key="type" 
                  :value="type"
                  class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
                >
                  {{ type }}
                </SelectItem>
              </SelectContent>
            </Select>
            
            <!-- View Mode Toggle -->
            <div class="flex items-center border border-[var(--theme-border-primary)]/40 rounded-md bg-[var(--theme-bg-primary)] overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                @click="setViewMode('unified')"
                :class="[
                  'h-8 px-2 lg:px-3 rounded-none border-0 text-xs',
                  viewMode === 'unified' 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
                ]"
              >
                <ListIcon class="w-3 h-3 lg:mr-1" />
                <span class="hidden lg:inline">Timeline</span>
              </Button>
              <div class="w-px h-4 bg-[var(--theme-border-primary)]/40"></div>
              <Button
                variant="ghost"
                size="sm"
                @click="setViewMode('swimlanes')"
                :class="[
                  'h-8 px-2 lg:px-3 rounded-none border-0 text-xs',
                  viewMode === 'swimlanes' 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
                ]"
              >
                <Layers class="w-3 h-3 lg:mr-1" />
                <span class="hidden lg:inline">Lanes</span>
              </Button>
            </div>
            
            <!-- Grouping Controls Toggle -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 text-xs gap-1"
                  :class="[
                    groupingPreferences.enabled && 'bg-primary/10 border-primary/40 text-primary'
                  ]"
                >
                  <SettingsIcon class="w-3 h-3" />
                  <span class="hidden lg:inline">Grouping</span>
                  <Badge v-if="groupingStats && groupingStats.reductionPercentage > 0" variant="secondary" class="ml-1 text-[10px] px-1">
                    -{{ groupingStats.reductionPercentage }}%
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-80 max-h-96 overflow-y-auto">
                <GroupingControls :grouping-stats="groupingStats" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <!-- Theme Toggle -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="sm" variant="outline" class="text-xs gap-1">
                <component :is="currentThemeIcon" class="w-3 h-3" />
                <span class="hidden lg:inline">{{ themes.autoThemeEnabled.value ? 'Auto' : (themes.state.value.currentTheme === 'dark' ? 'Dark' : 'Light') }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuItem @select="toggleAutoTheme" class="gap-2">
                <Monitor class="w-3 h-3" />
                Auto theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="themes.setTheme('light')" class="gap-2">
                <Sun class="w-3 h-3" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem @select="themes.setTheme('dark')" class="gap-2">
                <Moon class="w-3 h-3" />
                Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Mobile Actions -->
        <div class="flex md:hidden items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            class="text-xs p-2 h-8 w-8"
            @click="showHookInstaller = true"
          >
            <Plus class="w-3 h-3" />
          </Button>
        </div>
      </div>
    </header>

    <main class="h-full grid grid-rows-[auto,1fr] min-w-0">
      <div class="sticky top-0 z-30 px-2 sm:px-3 py-2 sm:py-3 border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          <!-- Live Activity Monitor (combined event + token activity) -->
          <LiveActivityMonitor 
            :events="fullyFilteredEvents" 
            :filters="filters as any" 
            :timeline-scroll="timelineScrollPosition"
            :ws-connection="ws"
            :active-sessions-count="uniqueSessionsCount"
          />
          
          <!-- Token Usage Card (simplified, clickable) -->
          <TokenUsageCard :ws-connection="ws" @open-modal="showTokenModal = true" />
        </div>
      </div>

      <div class="min-h-0 min-w-0">
        <Card class="h-full rounded-none">
          <!-- Unified Timeline View -->
          <EventTimeline 
            v-if="viewMode === 'unified'"
            ref="eventTimelineRef"
            :filters="filters as any" 
            @update:filters="filters = $event" 
            :selected-project="selectedProject" 
            v-model:stick-to-bottom="stickToBottom" 
            @scroll-sync="handleTimelineScroll" 
          />
          
          <!-- Swimlanes View -->
          <EventSwimlanes
            v-else
            :events="events"
            :filters="filters as any"
            :selected-project="selectedProject"
            v-model:stick-to-bottom="stickToBottom"
            @scroll-sync="handleTimelineScroll"
          />
        </Card>
      </div>
    </main>

    <StickScrollButton :stick-to-bottom="stickToBottom" @toggle="stickToBottom = !stickToBottom" />

    <div v-if="error" class="fixed bottom-4 left-4 right-4 sm:right-auto">
      <Alert variant="destructive" class="text-xs">
        <AlertCircle class="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
    </div>

    <ThemeManager :is-open="showThemeManager" @close="showThemeManager = false" />
    
    <HookInstallerModal 
      :is-open="showHookInstaller" 
      @close="showHookInstaller = false"
      @success="handleProjectInstalled"
    />
    
    <!-- Token Usage Modal -->
    <TokenUsageModal 
      v-if="showTokenModal"
      :ws-connection="ws"
      @close="showTokenModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { AlertCircle, Sun, Moon, Monitor, ListIcon, Layers, Settings as SettingsIcon, Plus, Menu, X } from 'lucide-vue-next';

const { events, error, ws } = useWebSocket('ws://localhost:3000/stream');
const themes = useThemes();
const { groupingPreferences, swimlanePreferences } = useGroupingPreferences();
const { getDisplayName, saveAppMapping } = useAppNames();

const filters = ref({ sessionId: '__ALL_SESSIONS__', eventType: '__ALL_TYPES__' });
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showThemeMenu = ref(false);
const showHookInstaller = ref(false);
const showMobileMenu = ref(false);
const showTokenModal = ref(false);
const selectedProject = ref<string>('');
const localSelectedProject = ref<string>('__ALL__');
const viewMode = ref<'unified' | 'swimlanes'>('unified');
const eventTimelineRef = ref();

// Reactive grouping stats from EventTimeline
const groupingStats = computed(() => {
  return eventTimelineRef.value?.groupingStats || null;
});

const uniqueSessionsCount = computed(() => {
  const sessions = new Set(events.value.map(e => e.session_id));
  return sessions.size;
});

const currentThemeIcon = computed(() => {
  if (themes.autoThemeEnabled.value) return Monitor;
  return themes.state.value.currentTheme === 'dark' ? Moon : Sun;
});

// Project filter logic (moved from ProjectFilterCards)
const projectOf = (e: any) => e.project || e.payload?.project || e.source_app;

const baseFilteredEvents = computed(() => {
  if (!filters.value) return events.value;
  return events.value.filter(event => {
    if (filters.value.sessionId && filters.value.sessionId !== '__ALL_SESSIONS__' && event.session_id !== filters.value.sessionId) return false;
    if (filters.value.eventType && filters.value.eventType !== '__ALL_TYPES__' && event.hook_event_type !== filters.value.eventType) return false;
    return true;
  });
});

// Complete filtered events including project filtering (for EventHeaderPulse)
const fullyFilteredEvents = computed(() => {
  let filtered = baseFilteredEvents.value;
  if (selectedProject.value) {
    filtered = filtered.filter(event => projectOf(event) === selectedProject.value);
  }
  console.log('[App.vue] Filter state:', {
    rawEventsCount: events.value.length,
    baseFilteredCount: baseFilteredEvents.value.length,
    fullyFilteredCount: filtered.length,
    filters: filters.value,
    selectedProject: selectedProject.value
  });
  return filtered;
});

const totalFilteredCount = computed(() => baseFilteredEvents.value.length);

const projectsWithCounts = computed(() => {
  const projectCounts = new Map();
  baseFilteredEvents.value.forEach(event => {
    const project = projectOf(event);
    projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
  });
  
  return Array.from(projectCounts.entries()).map(([name, count]) => ({ name, count }));
});

const uniqueSessions = computed(() => {
  return [...new Set(events.value.map(e => e.session_id))];
});

const uniqueEventTypes = computed(() => {
  return [...new Set(events.value.map(e => e.hook_event_type))];
});

const updateSelectedProject = (value: any) => {
  const stringValue = String(value);
  localSelectedProject.value = stringValue || '__ALL__';
  selectedProject.value = (stringValue === '__ALL__' || !stringValue) ? '' : stringValue;
};

const updateSessionId = (value: any) => {
  filters.value.sessionId = String(value) || '__ALL_SESSIONS__';
};

const updateEventType = (value: any) => {
  filters.value.eventType = String(value) || '__ALL_TYPES__';
};

const timelineScrollPosition = ref(0);

const handleTimelineScroll = (scrollTop: number) => {
  timelineScrollPosition.value = scrollTop;
};

const toggleAutoTheme = () => {
  if (themes.autoThemeEnabled.value) themes.disableAutoTheme();
  else themes.enableAutoTheme();
};

const setViewMode = (mode: 'unified' | 'swimlanes') => {
  viewMode.value = mode;
  
  // Auto-enable swimlanes preference when switching to swimlanes view
  if (mode === 'swimlanes' && !swimlanePreferences.value.enabled) {
    swimlanePreferences.value.enabled = true;
  }
};

const handleProjectInstalled = (projectData: { name: string; directory: string; slug: string }) => {
  console.log('Project installed successfully:', projectData);
  
  // Save the app name mapping
  saveAppMapping(projectData.slug, projectData.name);
  
  console.log('App mapping saved:', { slug: projectData.slug, displayName: projectData.name });
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) showThemeMenu.value = false;
};

// Sync view mode with swimlane preferences
watch(() => swimlanePreferences.value.enabled, (enabled) => {
  if (enabled && viewMode.value === 'unified') {
    viewMode.value = 'swimlanes';
  } else if (!enabled && viewMode.value === 'swimlanes') {
    viewMode.value = 'unified';
  }
});

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>