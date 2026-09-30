package com.mesh.profiles;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class ProfileCatalogController {
    private final ProfileService profiles;
    public ProfileCatalogController(ProfileService profiles) { this.profiles = profiles; }
    @GetMapping("/goals") public List<ProfileService.GoalResponse> goals() { return profiles.goalCatalog(); }
    @GetMapping("/interests") public List<ProfileService.InterestResponse> interests() { return profiles.interestCatalog(); }
    @GetMapping("/domains") public List<ProfileService.DomainResponse> domains() { return profiles.domainCatalog(); }
}
