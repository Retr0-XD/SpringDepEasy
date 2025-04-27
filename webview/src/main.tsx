import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from 'react-query'

// Create a client for React Query
const queryClient = new QueryClient()

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App vscode={vscode} />
    </QueryClientProvider>
  </React.StrictMode>,
)

// Helper function to access VS Code API
declare function acquireVsCodeApi(): any;