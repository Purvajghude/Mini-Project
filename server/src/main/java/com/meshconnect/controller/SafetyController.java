package com.meshconnect.controller;

import com.meshconnect.dto.SafetyDto;
import com.meshconnect.service.BlockService;
import com.meshconnect.service.SafetyService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SafetyController {
    private final BlockService blocks;
    private final SafetyService safety;
    public SafetyController(BlockService blocks, SafetyService safety) { this.blocks = blocks; this.safety = safety; }

    @PostMapping("/blocks/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(@PathVariable Long userId) { blocks.block(userId); }

    @DeleteMapping("/blocks/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(@PathVariable Long userId) { blocks.unblock(userId); }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public SafetyDto.ReportResponse report(@Valid @RequestBody SafetyDto.CreateReportRequest request) { return safety.report(request); }

    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SafetyDto.ReportResponse> reports(@RequestParam(defaultValue = "50") int size) { return safety.openReports(size); }
}
