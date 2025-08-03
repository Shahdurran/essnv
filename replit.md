# MDS AI Analytics - Rao Dermatology Business Intelligence Platform

## Overview

MDS AI Analytics is a comprehensive AI-powered business analytics dashboard designed specifically for Rao Dermatology's multi-location practice management. The platform provides real-time insights, forecasting, and natural language analytics queries through an AI business assistant powered by OpenAI GPT-4o. The application serves 5 practice locations and offers comprehensive analytics for both medical and cosmetic dermatology procedures, including revenue projections, patient volume analysis, insurance breakdown, and key performance indicators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend with TypeScript, built using Vite for fast development and optimized production builds. The UI is constructed with shadcn/ui components based on Radix UI primitives, providing a professional medical dashboard interface. The frontend follows a component-based architecture with:

- **Component Structure**: Organized into feature-specific components (LocationSelector, AIBusinessAssistant, KeyMetricsTrendsChart, TopRevenueProcedures, PracticeInsights, RevenueProjections)
- **State Management**: Uses React hooks for local state and TanStack Query for server state management and caching
- **Routing**: Implements client-side routing with Wouter for lightweight navigation
- **Styling**: Uses Tailwind CSS with custom CSS variables for theming, including medical-specific color palette
- **Charts**: Integrates Chart.js for data visualization and trends analysis

### Backend Architecture
The backend is built on Express.js with TypeScript, following a RESTful API design pattern. The server architecture includes:

- **API Routes**: Organized into feature-specific endpoints for analytics, locations, AI queries, and practice management
- **Middleware**: Implements request logging, error handling, and JSON parsing
- **AI Integration**: Direct integration with OpenAI GPT-4o API for natural language business analytics queries
- **Development Setup**: Vite integration for development with hot module replacement and error overlay

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with full TypeScript support and schema validation
- **Schema Design**: Comprehensive medical practice schema including users, practice locations, patients, procedures, visits, and performance metrics
- **Data Models**: Structured for dermatology-specific analytics including CPT codes, procedure categories (medical/cosmetic), insurance providers, and revenue tracking

### Authentication and Authorization
The application implements session-based authentication with:

- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User Roles**: Support for practice_owner, staff, and admin roles
- **Security**: Credential-based authentication with secure session handling

## External Dependencies

### AI and Analytics Services
- **OpenAI GPT-4o**: Powers the AI business assistant for natural language analytics queries and business intelligence insights
- **Chart.js/Recharts**: Provides interactive data visualization for revenue trends, projections, and key metrics

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL database for production data storage
- **Drizzle Kit**: Database migration and schema management tools

### Frontend Libraries
- **React 18**: Core frontend framework with hooks and modern patterns
- **TanStack Query**: Server state management, caching, and data synchronization
- **Wouter**: Lightweight client-side routing solution
- **Radix UI**: Accessible component primitives for professional UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom medical theming

### Development and Build Tools
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for server-side code
- **PostCSS**: CSS processing with Tailwind CSS integration

### Form and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for API requests and database operations
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Medical Practice Specific
The application is designed specifically for dermatology practice management with support for:
- Real dermatology CPT codes and procedures
- Medical vs cosmetic procedure categorization
- Insurance payer analysis and AR days tracking
- Multi-location practice analytics across 5 Rao Dermatology locations