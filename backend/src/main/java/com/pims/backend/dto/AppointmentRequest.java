package com.pims.backend.dto;

import java.time.LocalDateTime;

import com.pims.backend.enums.AppointmentType;

public class AppointmentRequest {
    private Long clientId;
    private Long patientId;
    private Long vetId;
    private Long resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String notes;
    private String reason;
    private AppointmentType type;

    public AppointmentRequest() {
    }

    public AppointmentRequest(Long clientId, Long patientId, Long vetId, Long resourceId, LocalDateTime startTime, LocalDateTime endTime, String notes, String reason, AppointmentType type) {
        this.clientId = clientId;
        this.patientId = patientId;
        this.vetId = vetId;
        this.resourceId = resourceId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.reason = reason;
        this.type = type;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getVetId() {
        return vetId;
    }

    public void setVetId(Long vetId) {
        this.vetId = vetId;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public AppointmentType getType() {
        return type;
    }

    public void setType(AppointmentType type) {
        this.type = type;
    }
}
