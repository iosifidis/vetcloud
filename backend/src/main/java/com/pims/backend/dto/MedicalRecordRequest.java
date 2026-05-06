package com.pims.backend.dto;

import java.math.BigDecimal;

public class MedicalRecordRequest {
    private Long appointmentId;
    private String subjective;
    private String objective;
    private String assessment;
    private String plan;
    private BigDecimal cost;

    // Vital Signs Fields
    private Double weight; // in Kg
    private Double temperature; // in Celsius
    private Integer heartRate; // in bpm
    private Integer respiratoryRate; // in bpm
    private String mucousMembranes; // e.g., "Pink", "Pale"
    private Double crt; // Capillary Refill Time in seconds

    public MedicalRecordRequest() {
    }

    public MedicalRecordRequest(Long appointmentId, String subjective, String objective, String assessment, String plan,
            BigDecimal cost, Double weight, Double temperature, Integer heartRate, Integer respiratoryRate,
            String mucousMembranes, Double crt) {
        this.appointmentId = appointmentId;
        this.subjective = subjective;
        this.objective = objective;
        this.assessment = assessment;
        this.plan = plan;
        this.cost = cost;
        this.weight = weight;
        this.temperature = temperature;
        this.heartRate = heartRate;
        this.respiratoryRate = respiratoryRate;
        this.mucousMembranes = mucousMembranes;
        this.crt = crt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getSubjective() {
        return subjective;
    }

    public void setSubjective(String subjective) {
        this.subjective = subjective;
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public String getAssessment() {
        return assessment;
    }

    public void setAssessment(String assessment) {
        this.assessment = assessment;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Integer heartRate) {
        this.heartRate = heartRate;
    }

    public Integer getRespiratoryRate() {
        return respiratoryRate;
    }

    public void setRespiratoryRate(Integer respiratoryRate) {
        this.respiratoryRate = respiratoryRate;
    }

    public String getMucousMembranes() {
        return mucousMembranes;
    }

    public void setMucousMembranes(String mucousMembranes) {
        this.mucousMembranes = mucousMembranes;
    }

    public Double getCrt() {
        return crt;
    }

    public void setCrt(Double crt) {
        this.crt = crt;
    }

    // Legacy/Simple fields
    private String diagnosis;
    private String treatment;
    private String notes;

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatment() {
        return treatment;
    }

    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
