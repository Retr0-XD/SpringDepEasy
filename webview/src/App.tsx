import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';

// Define dependency type
interface Dependency {
  groupId: string;
  artifactId: string;
  version: string;
  description: string;
}

// Props for App component
interface AppProps {
  vscode: any;
}

function App({ vscode }: AppProps) {
  const [search, setSearch] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080');
  
  // Handle messages from VS Code extension
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'setState':
          if (message.backendUrl) {
            setBackendUrl(message.backendUrl);
          }
          break;
      }
    };
    
    // Add event listener
    window.addEventListener('message', messageHandler);
    
    // Notify VS Code that webview is ready
    vscode.postMessage({ command: 'init' });
    
    // Cleanup
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [vscode]);
  
  // For now, let's create a placeholder query while we develop the backend integration
  const { data, isLoading, error } = useQuery<Dependency[]>(
    ['dependencies', search],
    async () => {
      // Mock API call - will be replaced with actual API in Week 5
      return new Promise<Dependency[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              groupId: 'org.springframework.boot',
              artifactId: 'spring-boot-starter-web',
              version: '3.1.0',
              description: 'Starter for building web applications with Spring MVC'
            },
            {
              groupId: 'org.springframework.boot',
              artifactId: 'spring-boot-starter-data-jpa',
              version: '3.1.0',
              description: 'Starter for using Spring Data JPA with Hibernate'
            },
            {
              groupId: 'org.springframework.boot',
              artifactId: 'spring-boot-starter-security',
              version: '3.1.0',
              description: 'Starter for using Spring Security'
            },
            {
              groupId: 'org.springframework.boot',
              artifactId: 'spring-boot-starter-actuator',
              version: '3.1.0',
              description: 'Starter for using Spring Boot Actuator for metrics and monitoring'
            }
          ].filter(dep => 
            !search || 
            dep.artifactId.toLowerCase().includes(search.toLowerCase()) || 
            dep.description.toLowerCase().includes(search.toLowerCase())
          ));
        }, 500);
      });
    },
    {
      enabled: true, // Always fetch initial data
    }
  );

  // Debounce search input to avoid excessive API calls
  const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const debouncedHandleSearchChange = useCallback(debounce(handleSearchChange, 500), []);

  const handleAddDependency = (dependency: Dependency) => {
    // Send message to VS Code extension
    vscode.postMessage({
      command: 'addDependency',
      dependency
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-green-600 mb-6">SpringDepEasy</h1>
      <div className="mb-6">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search dependencies (e.g., web, jpa, security)"
          onChange={debouncedHandleSearchChange}
          defaultValue={search}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-2">Loading dependencies...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          <p>Error loading dependencies. Please try again.</p>
          <p className="text-sm mt-2">Make sure the backend server is running at {backendUrl}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data && data.length > 0 ? (
            data.map((dependency) => (
              <div 
                key={`${dependency.groupId}:${dependency.artifactId}`}
                className="p-4 border border-gray-200 rounded shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{dependency.artifactId}</h3>
                    <p className="text-sm text-gray-600">{dependency.groupId}</p>
                    <p className="mt-1">{dependency.description}</p>
                    <p className="mt-1 text-sm text-blue-600">Version: {dependency.version}</p>
                  </div>
                  <button
                    onClick={() => handleAddDependency(dependency)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                  >
                    Add Dependency
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p>No dependencies found for "{search}"</p>
              <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
            </div>
          )}
        </div>
      )}
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>SpringDepEasy v0.1.0 - Simplifying Spring Boot dependency management</p>
      </footer>
    </div>
  );
}

export default App;