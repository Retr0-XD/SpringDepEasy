package com.springdepeasy.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

@RestController
@RequestMapping("/api/versions")
public class VersionController {

    @Autowired
    private RestTemplate restTemplate;

    @Cacheable("versions")
    @GetMapping
    public List<String> getVersions(
            @RequestParam String groupId,
            @RequestParam String artifactId) {
        
        // First try to get versions from Maven Central
        try {
            String url = String.format(
                "https://search.maven.org/solrsearch/select?q=g:%s+AND+a:%s&core=gav&rows=100&wt=json",
                groupId, artifactId
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> responseHeader = (Map<String, Object>) response.get("responseHeader");
            
            if ((int) responseHeader.get("status") == 0) {
                @SuppressWarnings("unchecked")
                Map<String, Object> response2 = (Map<String, Object>) response.get("response");
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> docs = (List<Map<String, Object>>) response2.get("docs");
                
                List<String> versions = new ArrayList<>();
                for (Map<String, Object> doc : docs) {
                    versions.add((String) doc.get("v"));
                }
                
                Collections.reverse(versions); // Latest versions first
                return versions;
            }
        } catch (Exception e) {
            System.err.println("Error fetching from Maven Central: " + e.getMessage());
        }
        
        // If Maven Central fails, try to find in local Maven repository
        try {
            String repoPath = System.getProperty("user.home") + "/.m2/repository";
            String artifactPath = repoPath + "/" + 
                                groupId.replace('.', '/') + "/" + 
                                artifactId;
            
            File metadataFile = new File(artifactPath + "/maven-metadata.xml");
            
            if (metadataFile.exists()) {
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(metadataFile);
                
                NodeList versionNodes = doc.getElementsByTagName("version");
                List<String> versions = new ArrayList<>();
                
                for (int i = 0; i < versionNodes.getLength(); i++) {
                    versions.add(versionNodes.item(i).getTextContent());
                }
                
                Collections.reverse(versions); // Latest versions first
                return versions;
            }
        } catch (Exception e) {
            System.err.println("Error reading from local Maven repository: " + e.getMessage());
        }
        
        return Collections.emptyList();
    }
}