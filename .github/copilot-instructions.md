# IEA Task 43 WRA Data Model Wizard

React + TypeScript + Vite web application that provides a form wizard interface for creating IEA Task 43 Wind Resource Assessment data model configurations. The application allows users to digitally represent measurement station configurations including met masts, lidars, sodars, floating lidars, and solar installations.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

- Bootstrap, build, and test the repository:
  - `npm install` -- takes 2.5 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
  - `npm run build` -- takes 10 seconds. NEVER CANCEL. Set timeout to 3+ minutes.
  - `npm run check-types` -- takes 1 second. TypeScript compilation check.
- Run the development server:
  - `npm run dev` -- starts development server on http://localhost:5173/
  - Server starts in ~200ms and runs indefinitely until stopped
- Run production preview:
  - `npm run preview` -- serves built files on http://localhost:4173/
- Linting:
  - `npm run lint` -- takes 2-3 seconds. Currently has 144 ESLint errors (mostly @typescript-eslint/no-explicit-any) but this is expected in development

## Validation

- Always manually validate any new code by testing the complete user workflow:
  1. Start development server with `npm run dev`
  2. Navigate to http://localhost:5173/
  3. Click "Try the Data Model" button
  4. Fill out at least the Basic Information step (Author, Organisation, Plant Type)
  5. Verify form validation works (errors appear/disappear correctly)
  6. Test navigation between wizard steps
- ALWAYS run through at least one complete end-to-end scenario after making changes
- The application has a 6-step wizard: Basic Information → Location & Properties → Loggers → Sensors → Measurement Points → Review & Export
- Always run `npm run lint` and `npm run check-types` before committing (lint has known issues but check-types must pass)
- The build creates a production bundle in `dist/` directory (~2.2MB bundled JS, warning about chunk size is expected)

## Common Tasks

The following are validated commands and timings. Reference them instead of running bash commands to save time.

### Repository Root Structure
```
/home/runner/work/IEATAsk43WizardUI/IEATAsk43WizardUI/
├── .bolt/                    # Bolt.new configuration
├── .claude/                  # Claude configuration  
├── .git/                     # Git repository
├── .gitignore               # Git ignore rules
├── components.json          # Shadcn/ui components config
├── eslint.config.js         # ESLint configuration
├── index.html              # Vite HTML template
├── LICENSE                 # Project license
├── package.json            # NPM dependencies and scripts
├── package-lock.json       # NPM lockfile
├── plan.md                 # Development plan and progress
├── postcss.config.js       # PostCSS configuration
├── public/                 # Static assets
├── README.md               # Project documentation (minimal)
├── src/                    # Source code
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.app.json       # TypeScript config for app
├── tsconfig.json           # Main TypeScript config
├── tsconfig.node.json      # TypeScript config for build tools
└── vite.config.ts          # Vite build configuration
```

### Source Code Structure
```
src/
├── App.tsx                 # Main application component
├── components/            # React components
│   ├── FormWizard.tsx    # Main wizard component
│   ├── LandingPage.tsx   # Landing page component
│   ├── LoggerStep.tsx    # Logger configuration step
│   ├── steps/            # Wizard step components
│   └── ui/               # Reusable UI components
├── index.css             # Global styles
├── lib/                  # Utility libraries
├── main.tsx             # React entry point
├── store/               # Zustand state management
├── types/
│   └── schema.ts        # IEA Task 43 data model TypeScript types
├── utils/               # Utility functions
└── vite-env.d.ts        # Vite type definitions
```

### Key Dependencies
- **React 18** - UI framework
- **TypeScript 5.5+** - Type safety
- **Vite 5.4+** - Build tool and dev server
- **TailwindCSS** - Styling framework
- **Radix UI** - Accessible UI components (@radix-ui/react-*)
- **React Hook Form** - Form management
- **Zustand** - State management
- **Zod** - Schema validation
- **Lucide React** - Icons

### NPM Scripts Timing Reference
```bash
npm install          # 2m 22s (2.5 minutes) - NEVER CANCEL
npm run dev         # ~200ms startup, runs indefinitely
npm run build       # 8.81s (9 seconds) - NEVER CANCEL  
npm run preview     # ~200ms startup, runs indefinitely
npm run lint        # 2.36s (144 errors expected)
npm run check-types # 0.31s (must pass - no errors)
```

## Application Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Radix UI components
- **State**: Zustand store for wizard state management
- **Forms**: React Hook Form with Zod validation
- **Build**: Vite with TypeScript compilation
- **Linting**: ESLint with TypeScript rules

### Core Functionality
The application is a 6-step wizard for creating IEA Task 43 measurement configuration data:

1. **Basic Information**: Author, organization, plant details
2. **Location & Properties**: Measurement station locations and properties
3. **Loggers**: Data logger configurations
4. **Sensors**: Sensor specifications and mounting
5. **Measurement Points**: Height-specific measurement configurations
6. **Review & Export**: Validation and JSON export

### Data Model
- Complex TypeScript schema in `src/types/schema.ts`
- Supports multiple measurement station types: mast, lidar, sodar, floating_lidar, wave_buoy, adcp, solar, virtual_met_mast, reanalysis
- IEA Task 43 compliant data model with extensive enums and validation
- Form data converts to standardized JSON export format

## Build Process

### Development Workflow
1. `npm install` - Install dependencies (2.5 min)
2. `npm run dev` - Start development server
3. Make changes to source files
4. Changes auto-reload in browser via Vite HMR
5. Test functionality manually in browser
6. `npm run check-types` - Validate TypeScript (must pass)
7. `npm run lint` - Check code style (144 known issues)
8. `npm run build` - Create production build for testing

### Production Build
- Run `npm run build` to create optimized production build
- Output goes to `dist/` directory
- Build includes code splitting and optimization
- Bundle size: ~2.2MB JS (large due to comprehensive UI components)
- Warning about chunk size is expected and normal

## Common Development Patterns

### Adding New Form Fields
- Update TypeScript types in `src/types/schema.ts`
- Add form fields to appropriate step component in `src/components/steps/`
- Update validation logic if needed
- Test form validation and data flow

### Modifying Wizard Steps
- Step components are in `src/components/steps/`
- Main wizard logic in `src/components/FormWizard.tsx`
- State management via Zustand store in `src/store/`
- Navigation handled by wizard component

### Styling Changes
- Uses TailwindCSS utility classes
- Custom components in `src/components/ui/`
- Color scheme and spacing follow design system
- Responsive design with mobile-first approach

## Troubleshooting

### Common Issues
- **ESLint errors**: 144 errors are expected (mostly @typescript-eslint/no-explicit-any)
- **TypeScript errors**: Must resolve all TypeScript errors (npm run check-types should pass)
- **Build warnings**: Chunk size warnings are expected due to large bundle
- **Dev server**: Runs on port 5173, preview on 4173

### Performance Notes
- Initial npm install takes 2.5 minutes (normal)
- Build process is fast (~9 seconds)
- Development server has instant hot reload
- Large bundle size is expected due to comprehensive component library

## Testing Strategy

### Manual Testing Checklist
After making changes, always test:
1. ✅ Landing page loads correctly
2. ✅ "Try the Data Model" button works
3. ✅ Basic Information form validation (Author, Organisation, Plant Type required)
4. ✅ Form fields accept input correctly
5. ✅ Dropdown selections work (Plant Type, Campaign Status)
6. ✅ Date pickers function properly
7. ✅ Step navigation between wizard steps
8. ✅ Progress indicator updates correctly
9. ✅ Validation errors appear/disappear appropriately

### Build Validation
Always validate builds work:
- `npm run build` completes successfully
- `npm run preview` serves the built application
- Application functions identically to development mode

## Key Files to Monitor

### Critical Files
- `src/types/schema.ts` - Core data model types
- `src/components/FormWizard.tsx` - Main wizard logic
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration

### Frequently Modified
- `src/components/steps/*.tsx` - Individual wizard steps
- `src/components/ui/*.tsx` - UI components
- `src/store/*.ts` - Application state
- `src/utils/*.ts` - Helper functions

Always run complete validation workflow after modifying these core files.