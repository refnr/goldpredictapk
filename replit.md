# Gold Predict - XAUUSD Market Analysis Platform

## Overview
Gold Predict is a real-time platform for XAU/USD (Gold Spot vs US Dollar) price prediction and market analysis. It offers live price tracking, technical analysis with indicators (RSI, MACD, SMA), statistical price predictions, and trading signal generation. The application is a full-stack TypeScript project with a React frontend and an Express backend, featuring a dark-themed financial dashboard. Its core purpose is to provide users with tools for informed decision-making in the gold market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **UI/UX**: shadcn/ui components, Tailwind CSS for styling with a dark financial theme and gold accents. Recharts is used for data visualization.
- **State Management**: TanStack React Query for server state.
- **Routing**: Wouter for client-side routing.
- **Build**: Vite.

### Backend
- **Framework**: Express 5 on Node.js with TypeScript.
- **API**: REST API with type-safe route definitions.
- **Database ORM**: Drizzle ORM with PostgreSQL.
- **Validation**: Zod schemas for request/response validation.

### Data Flow
- Shared Zod schemas and TypeScript types ensure type safety across frontend and backend.
- Frontend uses custom hooks with React Query for data interactions.
- Backend features a modular storage layer for database operations.

### Key Design Decisions
- **Monorepo Structure**: Organized into `/client`, `/server`, and `/shared` for clear separation of concerns.
- **Type Sharing**: Zod and TypeScript types are extensively shared to maintain consistency.
- **Data Redundancy**: Multiple price data sources with fallback mechanisms, including simulated data for robustness.
- **Technical Analysis**: Integration of `yahoo-finance2` for market data and `technicalindicators` for calculations.
- **Market Hours**: Dynamic display of gold/forex market status.

### Authentication and Subscription
- **Authentication**: Email/password-based system using `bcrypt` for password hashing and `express-session` with PostgreSQL for session management.
- **Subscription**: Monetization through Stripe subscriptions with a "Pro" tier.
    - Public-first architecture combining checkout and registration.
    - Feature gating based on subscription status for access to predictions and signals.
    - Daily prediction limits enforced per plan.
    - Uses Stripe Live Mode for real payments and webhooks for status synchronization.
- **Email Service**: `nodemailer` for welcome emails upon registration.

### UI Theming
- **Dark Theme**: Employs a near-black background (`#0a0a0a`) with neutral HSL values for borders and muted elements, ensuring a consistent financial aesthetic.
- **Light Theme**: Fully supported with inverted color schemes, ensuring all components are visible and functional.

## External Dependencies
### Data Sources
- **Yahoo Finance API**: Primary source for historical OHLC data.
- **Metal Price APIs**: Multiple fallback APIs for live XAUUSD spot prices.

### Database
- **PostgreSQL**: Main database used for all persistent data.
- **Drizzle Kit**: Utilized for database migrations and schema management.

### Third-Party Services
- **Google Fonts**: For typography (DM Sans, Space Grotesk, JetBrains Mono).
- **Stripe**: Payment gateway for subscription management, including customer portal and webhooks.

### Key NPM Packages
- **technicalindicators**: For RSI, MACD, SMA calculations.
- **simple-statistics**: For statistical analysis in prediction models.
- **date-fns**: For date manipulation.
- **connect-pg-simple**: PostgreSQL session store.
- **passport**: Authentication middleware.