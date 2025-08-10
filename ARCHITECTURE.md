# Architecture

## 🏗️ System Overview

Claude Monitor is built as a full-stack monitoring solution with real-time capabilities, designed to track and analyze Claude Code usage patterns, token consumption, and development workflows.

## Tech Stack

### Frontend
- **Nuxt 3**: Full-stack Vue.js framework with SSR/SPA capabilities
- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript with enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix Vue**: Headless UI primitives for accessible components
- **Shadcn/ui**: Pre-built component library built on Radix Vue
- **Unovis**: Data visualization library for charts and analytics

### Backend
- **Nitro**: Nuxt's universal server engine with edge deployment support
- **Better-SQLite3**: High-performance synchronous SQLite database driver
- **WebSockets**: Real-time bidirectional communication
- **Zod**: TypeScript-first schema validation library

### Infrastructure
- **SQLite**: Embedded database for local data persistence
- **File System**: Local file operations for hook installation
- **Environment Variables**: Configuration management

## Project Structure

```
claude-monitor/
├── app/
│   ├── components/          # Vue components
│   │   ├── ui/             # Reusable UI components (Shadcn/ui)
│   │   ├── LiveActivityMonitor.vue    # Real-time activity tracking
│   │   ├── EventTimeline.vue          # Unified timeline view
│   │   ├── EventSwimlanes.vue         # Project-based swimlanes
│   │   ├── TokenUsageCard.vue         # Token usage summary
│   │   ├── TokenUsageModal.vue        # Detailed token analytics
│   │   ├── HookInstallerModal.vue     # Project setup interface
│   │   ├── GroupingControls.vue       # Event grouping settings
│   │   └── ThemeManager.vue           # Theme customization
│   ├── composables/        # Vue composables for shared logic
│   │   ├── useWebSocket.ts           # WebSocket connection management
│   │   ├── useThemes.ts              # Theme system integration
│   │   ├── useAppNames.ts            # Project name management
│   │   └── useGroupingPreferences.ts # Event grouping logic
│   ├── utils/              # Utility functions
│   │   └── formatters.ts             # Data formatting helpers
│   └── app.vue             # Main application component
├── server/
│   ├── api/                # API endpoints
│   │   ├── events/         # Event-related endpoints
│   │   │   ├── recent.get.ts         # Fetch recent events
│   │   │   ├── historical.get.ts     # Historical data queries
│   │   │   └── filter-options.get.ts # Available filter options
│   │   ├── usage/          # Token usage endpoints
│   │   │   ├── blocks.get.ts         # Usage blocks for charts
│   │   │   ├── daily.get.ts          # Daily usage aggregation
│   │   │   └── blocks/live.get.ts    # Real-time usage data
│   │   ├── events.post.ts            # Event ingestion endpoint
│   │   └── install-hooks.post.ts     # Hook installation API
│   ├── utils/              # Server utilities
│   │   ├── db/             # Database operations
│   │   │   ├── init.ts               # Database initialization
│   │   │   ├── events.ts             # Event storage operations
│   │   │   └── themes.ts             # Theme preference storage
│   │   ├── validation/     # Request validation
│   │   │   └── schemas.ts            # Zod validation schemas
│   │   ├── hook-installer.ts         # Claude Code hook setup
│   │   ├── usage.ts                  # Token usage calculations
│   │   ├── ws-clients.ts             # WebSocket client management
│   │   └── types.ts                  # TypeScript type definitions
│   ├── plugins/
│   │   └── init.ts                   # Server initialization
│   └── routes/
│       └── stream.ts                 # WebSocket route handler
├── public/
│   ├── screenshots/        # Documentation screenshots
│   └── claude-resources/   # Hook installation files
│       └── hooks/          # Python hook scripts
└── .data/                  # SQLite database (auto-created)
    └── events.db           # Main database file
```

## Data Flow

### Event Ingestion
1. **Claude Code Hook Triggers**: Python hooks execute during Claude Code events
2. **HTTP POST**: Hooks send event data to `/api/events` endpoint
3. **Validation**: Zod schemas validate incoming event data
4. **Sanitization**: Payload sanitization prevents injection attacks
5. **Storage**: Events stored in SQLite database
6. **Broadcast**: Real-time updates sent via WebSocket to connected clients

### Real-Time Updates
1. **WebSocket Connection**: Frontend establishes persistent connection
2. **Event Broadcasting**: Server broadcasts new events to all connected clients
3. **Client Updates**: Frontend components reactively update with new data
4. **State Management**: Vue reactivity system manages UI state changes

### Data Visualization
1. **Data Queries**: API endpoints aggregate and filter event data
2. **Chart Processing**: Unovis processes data for visualization
3. **Real-Time Charts**: Live updates to charts via WebSocket data
4. **Interactive Filtering**: Client-side filtering with server-side optimization

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  hook_event_type TEXT NOT NULL,
  source_app TEXT,
  project TEXT,
  payload JSON,
  chat JSON,
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_events_session_id`: Fast session-based queries
- `idx_events_timestamp`: Chronological ordering
- `idx_events_type`: Event type filtering
- `idx_events_project`: Project-based filtering

## Security Considerations

### Input Validation
- **Zod Schemas**: Strict TypeScript-first validation
- **Request Size Limits**: Prevent large payload attacks
- **Payload Sanitization**: XSS and injection prevention
- **Dangerous Key Filtering**: Prototype pollution prevention

### Data Protection
- **Local Storage**: All data stored locally (no external transmission)
- **File System Permissions**: Restricted hook installation access
- **Environment Isolation**: Project-specific configurations

## Performance Optimizations

### Database
- **SQLite WAL Mode**: Improved concurrent access
- **Strategic Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connection management

### Frontend
- **Vue 3 Reactivity**: Efficient reactive updates
- **Component Lazy Loading**: On-demand component loading
- **WebSocket Optimization**: Minimal payload broadcasting
- **Event Grouping**: Reduced UI noise and improved performance

### Real-Time Processing
- **Selective Broadcasting**: Only relevant events sent to clients
- **Client-Side Filtering**: Reduced server load
- **Debounced Updates**: Prevent excessive UI updates

## Extensibility

### Hook System
- **Pluggable Hooks**: Easy addition of new Claude Code event types
- **Custom Events**: Support for user-defined event categories
- **Multi-Project Support**: Independent project configurations

### API Extensibility
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON API**: Consistent request/response format
- **Versioning Ready**: Structure supports future API versions

### Component Architecture
- **Modular Design**: Self-contained, reusable components
- **Composable Logic**: Shared business logic via composables
- **Theme System**: Flexible theming with CSS custom properties