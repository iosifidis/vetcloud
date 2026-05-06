package com.pims.backend.controller;

import com.pims.backend.dto.MedicalRecordRequest;
import com.pims.backend.entity.MedicalRecord;
import com.pims.backend.service.MedicalRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<MedicalRecord>> getMedicalRecordsByClient(@PathVariable Long clientId) {
        List<MedicalRecord> records = medicalRecordService.getMedicalRecordsByClient(clientId);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getMedicalRecordsByPatient(@PathVariable Long patientId) {
        List<MedicalRecord> records = medicalRecordService.getMedicalRecordsByPatient(patientId);
        return ResponseEntity.ok(records);
    }

    @PostMapping
    public ResponseEntity<MedicalRecord> createMedicalRecord(@RequestBody MedicalRecordRequest request) {
        try {
            MedicalRecord savedRecord = medicalRecordService.createMedicalRecord(request);
            return ResponseEntity.ok(savedRecord);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicalRecord> updateMedicalRecord(@PathVariable Long id,
            @RequestBody MedicalRecordRequest request) {
        try {
            MedicalRecord updatedRecord = medicalRecordService.updateMedicalRecord(id, request);
            return ResponseEntity.ok(updatedRecord);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}