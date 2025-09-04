# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 photo editing application built with TypeScript, React 19, and Konva.js for canvas manipulation. The app provides professional photo editing capabilities with a focus on privacy-preserving features like censoring and HIPAA compliance considerations.

## IMPORTANT: Project Specification System

This project follows a structured specification-driven development approach. When working on this codebase, you MUST reference and follow these documents in order:

### 1. Design Specification (.kiro/specs/photo-gallery/design.md)
- **Primary Authority**: The design document is the ultimate source of truth for implementation
- Contains comprehensive architecture, component interfaces, and data models
- Defines the layer system, tool architecture, and UI structure
- All implementation must strictly follow the patterns defined here

### 2. Requirements Document (.kiro/specs/photo-gallery/requirements.md)
- Defines 10 core requirements with detailed acceptance criteria
- Each requirement maps to specific user stories and functionality
- Use this to verify all features are properly implemented
- Requirements are referenced in tasks (e.g., _Requirements: 1.1, 1.6, 10.6_)

### 3. Tasks Document (.kiro/specs/photo-gallery/tasks.md)
- Contains 20 implementation tasks with checkboxes for progress tracking
- Tasks are ordered for logical development flow
- Each task references the requirements it fulfills
- Current progress: Tasks 1-12 completed, Tasks 13-20 pending

## Core Commands

### Development
- `npm run dev` - Start development server with Turbopack on port 3000
- `npm run build` - Build production bundle with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npx tsc --noEmit` - Run TypeScript type checking

## Architecture Overview

### State Management
The application uses Zustand for state management with two primary stores:

1. **editor-store.ts** - Manages canvas state, layers, and image data
   - Handles layer operations (add, update, delete, reorder)
   - Manages canvas properties and dimensions
   - Controls base image loading and metadata

2. **tools-store.ts** - Manages tool selection and tool-specific settings

### Layer System
The app implements a sophisticated layer system with multiple layer types:
- **base** - Background image layer (locked, non-movable)
- **paint** - Drawing and painting layers
- **adjustment** - Non-destructive image adjustments
- **censor** - Privacy-preserving censoring layers
- **overlay** - Additional overlay elements

### Component Structure
- **Editor.tsx** - Main editor container orchestrating all components
- **Canvas.tsx** - Konva Stage wrapper handling rendering
- **LayersPanel.tsx** - Layer management UI
- **ToolPalette.tsx** - Tool selection interface
- **ImageLoader.tsx** - Image upload and loading component
- Components use Radix UI primitives with custom styling via shadcn/ui patterns

### Key Technologies
- **Next.js 15** with App Router and Turbopack
- **React 19** with client-side rendering for editor
- **Konva.js** for canvas manipulation (loaded client-side only)
- **Tailwind CSS v4** for styling with tw-animate-css
- **Zustand** for state management
- **Radix UI** for accessible UI components

## Development Notes

### Client-Side Rendering
The main Editor component uses dynamic imports with SSR disabled due to Konva.js canvas requirements:
```typescript
dynamic(() => import('@/components/editor/Editor'), { ssr: false })
```

### Canvas Configuration
The webpack config in next.config.ts disables canvas module resolution on the client side and handles SVG imports as assets.

### Type Safety
The project uses strict TypeScript configuration. Always maintain type definitions in `/src/types/` for domain models.

### Performance Considerations
- Canvas operations are performance-critical
- Layer reordering maintains base layer at index 0
- Blend modes and filters can impact rendering performance

## Development Workflow

When implementing features or fixing issues:

1. **Check the Design**: Always refer to `.kiro/specs/photo-gallery/design.md` for architectural decisions
2. **Verify Requirements**: Cross-reference `.kiro/specs/photo-gallery/requirements.md` to ensure acceptance criteria are met
3. **Follow Tasks**: Use `.kiro/specs/photo-gallery/tasks.md` to understand implementation order and dependencies
4. **Maintain Consistency**: Ensure all code follows the established patterns in the design document
5. **Update Progress**: Mark tasks as completed in tasks.md when functionality is implemented

## Key Implementation Guidelines

- **Strict Compliance**: The design document is the authoritative source - do not deviate from its specifications
- **Layer System**: Base image layer must always remain at index 0 and be non-reorderable
- **Audit Logging**: All edit actions must be tracked for HIPAA compliance (Tasks 13-14 pending)
- **Local Processing**: No data should ever leave the browser - all operations are client-side
- **Performance Targets**: Brush operations must maintain <16ms latency, adjustments <100ms processing