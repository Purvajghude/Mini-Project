package com.meshconnect.repository;

import com.meshconnect.entity.Report;
import com.meshconnect.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    @EntityGraph(attributePaths = "reporter")
    Page<Report> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);
}
