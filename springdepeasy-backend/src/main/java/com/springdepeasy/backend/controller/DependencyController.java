package com.springdepeasy.backend.controller;

import com.springdepeasy.backend.model.Dependency;
import com.springdepeasy.backend.model.DependencyResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dependencies")
public class DependencyController {

    @Autowired
    private RestTemplate restTemplate;

    @Cacheable("dependencies")
    @GetMapping
    public List<Dependency> getDependencies() {
        String url = "https://start.spring.io/dependencies";
        DependencyResponse response = restTemplate.getForObject(url, DependencyResponse.class);
        
        return response.getDependencies().values().stream()
            .map(dep -> new Dependency(
                dep.getGroupId(),
                dep.getArtifactId(),
                dep.getVersion(),
                dep.getDescription()))
            .collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<Dependency> searchDependencies(@RequestParam String q) {
        return getDependencies().stream()
            .filter(dep -> 
                dep.getArtifactId().toLowerCase().contains(q.toLowerCase()) || 
                (dep.getDescription() != null && dep.getDescription().toLowerCase().contains(q.toLowerCase())))
            .collect(Collectors.toList());
    }
}