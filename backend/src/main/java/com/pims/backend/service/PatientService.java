package com.pims.backend.service;

import com.pims.backend.dto.PatientRequest;
import com.pims.backend.entity.Patient;
import java.util.List;
import java.util.Optional;

public interface PatientService {
    List<Patient> getAllPatients();

    Optional<Patient> getPatientById(Long id);

    List<Patient> getPatientsByOwnerId(Long ownerId);

    Patient createPatient(Long clientId, PatientRequest request);

    Patient updatePatient(Long id, PatientRequest request);

    void deletePatient(Long id);

    Patient transferPatient(Long patientId, Long newOwnerId);
}
