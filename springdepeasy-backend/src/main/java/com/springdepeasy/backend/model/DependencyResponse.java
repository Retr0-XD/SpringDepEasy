package com.springdepeasy.backend.model;

import java.util.Map;

public class DependencyResponse {
    private Map<String, Dependency> dependencies;

    public Map<String, Dependency> getDependencies() {
        return dependencies;
    }

    public void setDependencies(Map<String, Dependency> dependencies) {
        this.dependencies = dependencies;
    }
}