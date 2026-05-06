package com.pims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pims.backend.entity.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // Find all patients by client/owner ID
    List<Patient> findByOwnerId(Long ownerId);
}
