# SpringDepEasy

A VS Code extension to simplify Spring Boot dependency management in Maven projects.

## Overview

SpringDepEasy is a Visual Studio Code extension that simplifies adding, removing, and managing Spring Boot dependencies in Maven-based projects without relying on external sites like mvnrepository.com. It uses a Vite (React) webview for the UI and a Spring Boot backend to fetch dependency metadata from Spring Initializr and Maven Central.

## Features

- Search and add dependencies from Spring Initializr and Maven Central
- Remove dependencies from `pom.xml`
- Check version compatibility with your Spring Boot project
- Offline support using local Maven cache

## Development Setup

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3+
- VS Code

### Setup Instructions

1. Clone the repository
   ```
   git clone https://github.com/yourusername/springdepeasy.git
   cd springdepeasy
   ```

2. Set up the VS Code extension
   ```
   cd springdepeasy-extension
   npm install
   ```

3. Set up the React webview
   ```
   cd ../webview
   npm install
   ```

4. Set up the Spring Boot backend
   ```
   cd ../springdepeasy-backend
   mvn clean install
   ```

## Running the Extension

1. Start the Spring Boot backend
   ```
   cd springdepeasy-backend
   mvn spring-boot:run
   ```

2. Open the extension in VS Code and press F5 to start the extension in debug mode

## Project Structure

- `springdepeasy-extension/`: VS Code extension code
- `webview/`: React-based webview UI
- `springdepeasy-backend/`: Spring Boot backend for fetching dependency information

## License

MIT
