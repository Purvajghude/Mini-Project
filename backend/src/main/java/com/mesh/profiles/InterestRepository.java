package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    List<Interest> findAllByOrderByNameAsc();
}
