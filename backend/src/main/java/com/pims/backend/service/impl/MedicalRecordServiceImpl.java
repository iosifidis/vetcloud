package com.pims.backend.service.impl;

import com.pims.backend.dto.MedicalRecordRequest;
import com.pims.backend.entity.Appointment;
import com.pims.backend.entity.MedicalRecord;
import com.pims.backend.enums.AppointmentStatus;
import com.pims.backend.repository.AppointmentRepository;
import com.pims.backend.repository.MedicalRecordRepository;
import com.pims.backend.service.MedicalRecordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;

    public MedicalRecordServiceImpl(MedicalRecordRepository medicalRecordRepository,
            AppointmentRepository appointmentRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public List<MedicalRecord> getMedicalRecordsByClient(Long clientId) {
        return medicalRecordRepository.findByClientId(clientId);
    }

    @Override
    public List<MedicalRecord> getMedicalRecordsByPatient(Long patientId) {
        return medicalRecordRepository.findByPatientId(patientId);
    }

    @Override
    public MedicalRecord createMedicalRecord(MedicalRecordRequest request) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        MedicalRecord medicalRecord = new MedicalRecord();
        medicalRecord.setAppointment(appointment);
        medicalRecord.setPatient(appointment.getPatient());

        // Map fields
        medicalRecord.setDiagnosis(request.getDiagnosis());
        medicalRecord.setTreatment(request.getTreatment());
        medicalRecord.setNotes(request.getNotes());

        // Map vitals if they exist in Entity (Entity viewed earlier has
        // weight/temperature)
        medicalRecord.setWeight(request.getWeight());
        medicalRecord.setTemperature(request.getTemperature());
        medicalRecord.setCreatedAt(java.time.LocalDateTime.now());

        MedicalRecord savedRecord = medicalRecordRepository.save(medicalRecord);

        // Update appointment status to COMPLETED
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        return savedRecord;
    }

    @Override
    public MedicalRecord updateMedicalRecord(Long id, MedicalRecordRequest request) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical Record not found"));

        if (request.getDiagnosis() != null)
            record.setDiagnosis(request.getDiagnosis());
        if (request.getTreatment() != null)
            record.setTreatment(request.getTreatment());
        if (request.getNotes() != null)
            record.setNotes(request.getNotes());
        if (request.getWeight() != null)
            record.setWeight(request.getWeight());
        if (request.getTemperature() != null)
            record.setTemperature(request.getTemperature());

        return medicalRecordRepository.save(record);
    }
}
