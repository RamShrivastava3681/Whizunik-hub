# WhizUnik Portal - Frontend

This is the React frontend for the WhizUnik Portal application built with Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Authentication**: JWT tokens with js-cookie

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_URL=http://localhost:5000/api
```

### Running Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configs
├── config/             # Configuration files
└── utils/              # Helper utilities
```

## Features

- **Admin Dashboard**: User management and system administration
- **Authentication**: JWT-based login system with role-based access
- **Applications Management**: View and manage user applications
- **Potential Clients**: Manage client leads and inquiries
- **Responsive Design**: Mobile-first responsive interface
- **Dark/Light Theme**: Theme switching capability

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`. Key endpoints:

- `/auth/*` - Authentication endpoints
- `/admin/*` - Admin management endpoints
- `/applications/*` - Application management
- `/potential-clients/*` - Client management

## Component Architecture

- **Pages**: Main route components
- **Components**: Reusable UI elements
- **Hooks**: Custom hooks for API calls and state management
- **Utils**: Helper functions and utilities