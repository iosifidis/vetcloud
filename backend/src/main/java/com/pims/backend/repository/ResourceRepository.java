package com.pims.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pims.backend.entity.Resource;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
}
