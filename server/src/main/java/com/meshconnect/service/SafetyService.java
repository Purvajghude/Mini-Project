package com.meshconnect.service;

import com.meshconnect.dto.SafetyDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Report;
import com.meshconnect.entity.ReportStatus;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.repository.ReportRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SafetyService {
    private final CurrentUserService currentUser;
    private final ReportRepository reports;
    private final ProfileRepository profiles;

    public SafetyService(CurrentUserService currentUser, ReportRepository reports, ProfileRepository profiles) {
        this.currentUser = currentUser;
        this.reports = reports;
        this.profiles = profiles;
    }

    @Transactional
    public SafetyDto.ReportResponse report(SafetyDto.CreateReportRequest request) {
        AppUser reporter = currentUser.requireUser();
        Report saved = reports.save(new Report(reporter, request.targetType(), request.targetId(), blankToNull(request.reason())));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SafetyDto.ReportResponse> openReports(int size) {
        return reports.findByStatusOrderByCreatedAtAsc(ReportStatus.OPEN, PageRequest.of(0, Math.min(Math.max(size, 1), 100)))
                .getContent().stream().map(this::toResponse).toList();
    }

    private SafetyDto.ReportResponse toResponse(Report report) {
        String name = profiles.findByUserId(report.getReporter().getId()).map(profile -> profile.getDisplayName()).orElse(report.getReporter().getUsername());
        return new SafetyDto.ReportResponse(report.getId(), report.getReporter().getId(), name, report.getTargetType().name(), report.getTargetId(), report.getReason(), report.getStatus().name(), report.getCreatedAt());
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
