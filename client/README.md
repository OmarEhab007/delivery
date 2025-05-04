# Delivery App Admin Portal

A modern React-based admin portal for the Delivery App, providing a comprehensive interface for administrators to manage all aspects of the application.

## Features

- **Dashboard**: Visualize key metrics and recent activities
- **User Management**: Create, edit, and manage user accounts
- **Shipment Tracking**: Monitor and manage shipments
- **Application Processing**: Review and process applications
- **Truck Management**: Track and manage trucks
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **React.js**: Front-end UI library
- **Material UI**: Component library for modern UI design
- **Formik & Yup**: Form handling and validation
- **Axios**: API communications
- **JWT**: Authentication
- **Nivo**: Data visualization charts
- **React Router**: Navigation and routing

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

```
client/
├── public/              # Static files
├── src/
│   ├── api/             # API integration
│   ├── assets/          # Images and static assets
│   ├── components/      # Reusable components
│   │   ├── common/      # Shared components
│   │   └── layout/      # Layout components
│   ├── context/         # Context providers
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   ├── App.js           # Main application component
│   ├── index.js         # Application entry point
│   └── theme.js         # Theme configuration
```

## Running with the Backend

To run both the frontend and backend concurrently:

```
npm run dev:all
```

This command should be run from the root directory of the project, not from the client directory. 