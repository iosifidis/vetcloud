package com.pims.backend.service;

import com.pims.backend.dto.MedicalRecordRequest;
import com.pims.backend.entity.MedicalRecord;
import java.util.List;
import java.util.Optional;

public interface MedicalRecordService {
    List<MedicalRecord> getMedicalRecordsByClient(Long clientId);

    List<MedicalRecord> getMedicalRecordsByPatient(Long patientId);

    MedicalRecord createMedicalRecord(MedicalRecordRequest request);

    MedicalRecord updateMedicalRecord(Long id, MedicalRecordRequest request);
}
