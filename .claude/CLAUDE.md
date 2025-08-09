# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Monitor application - a real-time WebSocket-based monitoring dashboard built with Nuxt 3, Vue 3, and TypeScript. It provides live visualization of Claude Code hook events with activity charts, timeline views, and swimlane displays.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Generate static site
pnpm generate
```

## Architecture & Technology Stack

### Core Technologies
- **Nuxt 3** - Modern Vue.js framework with SSR/SSG capabilities
- **Vue 3** - Composition API throughout the codebase
- **TypeScript** - Full type safety across components and composables
- **Tailwind CSS v4** - Utility-first CSS with custom theming system
- **shadcn-vue** - Pre-built UI components in `app/components/ui/`
- **WebSocket** - Real-time event streaming via `ws://localhost:4000/stream`

### Key Architecture Patterns

1. **WebSocket Integration** (`app/composables/useWebSocket.ts`)
   - Manages real-time connection to backend server
   - Handles automatic reconnection
   - Implements infinite scrolling for historical events
   - Max event limit configured via `VITE_MAX_EVENTS_TO_DISPLAY` env var

2. **Component Structure**
   - Main app component: `app/app.vue` - orchestrates filters, views, and modals
   - Event visualization: `EventTimeline.vue` (unified view) and `EventSwimlanes.vue` (lane view)
   - Live monitoring: `LiveActivityMonitor.vue` - real-time activity charts and metrics
   - UI components follow shadcn pattern in `app/components/ui/`

3. **State Management**
   - Composables pattern for shared state (no Vuex/Pinia)
   - Key composables: `useWebSocket`, `useThemes`, `useGroupingPreferences`, `useAppNames`
   - Reactive filtering and grouping system

4. **Theming System**
   - CSS variable-based theming with multiple preset themes
   - Auto theme switching based on system preferences
   - Themes defined in `app/assets/css/themes.css`

5. **Event Data Flow**
   - Events stream from WebSocket → stored in composable → filtered by app.vue → rendered in components
   - Support for event grouping, filtering by project/session/type
   - Token usage tracking and visualization

## Project File Structure

```
app/
├── components/        # Vue components (UI widgets and features)
│   └── ui/           # shadcn-vue UI primitives
├── composables/      # Vue composables for shared logic
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and helpers
└── assets/css/       # Stylesheets and theme definitions
```

## Key Implementation Details

- All components use Vue 3 Composition API with `<script setup>`
- Reactive data flows through computed properties and watchers
- Event filtering happens at multiple levels for performance
- Canvas-based charts for smooth real-time visualizations
- Tailwind safelist includes dynamic color classes for runtime theming