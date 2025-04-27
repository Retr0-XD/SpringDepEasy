import React, { useState } from 'react';
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
  
  // This will be implemented in Week 5-6 to fetch from the Spring Boot backend
  // For now, let's create a placeholder query
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

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
          value={search}
          onChange={handleSearch}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading dependencies...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">Error loading dependencies. Please try again.</div>
      ) : (
        <div className="space-y-4">
          {data && data.length > 0 ? (
            data.map((dependency) => (
              <div 
                key={`${dependency.groupId}:${dependency.artifactId}`}
                className="p-4 border border-gray-200 rounded shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
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
              No dependencies found for "{search}". Try a different search term.
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