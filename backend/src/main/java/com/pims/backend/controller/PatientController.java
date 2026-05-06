package com.pims.backend.controller;

import com.pims.backend.dto.PatientRequest;
import com.pims.backend.entity.Patient;
import com.pims.backend.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    /**
     * Get all patients
     */
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    /**
     * Get patient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all patients by client/owner ID
     * GET /api/patients/owner/{ownerId}
     */
    @GetMapping("/owner/{ownerId}")
    public List<Patient> getPatientsByOwnerId(@PathVariable Long ownerId) {
        return patientService.getPatientsByOwnerId(ownerId);
    }

    /**
     * Update patient (full update)
     * PUT /api/patients/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(
            @PathVariable Long id,
            @RequestBody PatientRequest request) {
        try {
            Patient updatedPatient = patientService.updatePatient(id, request);
            return ResponseEntity.ok(updatedPatient);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete patient
     * DELETE /api/patients/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        try {
            patientService.deletePatient(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update patient status (deceased)
     * PUT /api/patients/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Patient> updatePatientStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {

        PatientRequest updateRequest = new PatientRequest();
        updateRequest.setIsDeceased(request.getIsDeceased());

        try {
            Patient updatedPatient = patientService.updatePatient(id, updateRequest);
            return ResponseEntity.ok(updatedPatient);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Transfer patient ownership
     * PUT /api/patients/{id}/owner/{ownerId}
     */
    @PutMapping("/{id}/owner/{ownerId}")
    public ResponseEntity<Patient> transferPatient(
            @PathVariable Long id,
            @PathVariable Long ownerId) {
        try {
            Patient transferredPatient = patientService.transferPatient(id, ownerId);
            return ResponseEntity.ok(transferredPatient);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Inner DTO for status update
     */
    public static class StatusRequest {
        private Boolean isDeceased;

        public Boolean getIsDeceased() {
            return isDeceased;
        }

        public void setIsDeceased(Boolean isDeceased) {
            this.isDeceased = isDeceased;
        }
    }
}
