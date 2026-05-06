package com.pims.backend.dto;

import java.time.LocalDate;

public class PatientRequest {
    private String name;
    private String species; // DOG, CAT, RABBIT, BIRD, OTHER
    private String breed;
    private String sex; // MALE, FEMALE
    private LocalDate birthDate;
    private Boolean isDateOfBirthApproximate;
    private String microchipNumber;
    private LocalDate microchipDate;
    private Boolean isSterilized;
    private LocalDate sterilizationDate;
    private Float weight;
    private Boolean isDeceased;

    public PatientRequest() {
    }

    public PatientRequest(String name, String species, String breed, String sex, LocalDate birthDate,
            String microchipNumber, LocalDate microchipDate, Boolean isSterilized, LocalDate sterilizationDate,
            Float weight, Boolean isDeceased) {
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.sex = sex;
        this.birthDate = birthDate;
        this.microchipNumber = microchipNumber;
        this.microchipDate = microchipDate;
        this.isSterilized = isSterilized;
        this.sterilizationDate = sterilizationDate;
        this.weight = weight;
        this.isDeceased = isDeceased;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public Boolean getIsDateOfBirthApproximate() {
        return isDateOfBirthApproximate;
    }

    public void setIsDateOfBirthApproximate(Boolean isDateOfBirthApproximate) {
        this.isDateOfBirthApproximate = isDateOfBirthApproximate;
    }

    public String getMicrochipNumber() {
        return microchipNumber;
    }

    public void setMicrochipNumber(String microchipNumber) {
        this.microchipNumber = microchipNumber;
    }

    public LocalDate getMicrochipDate() {
        return microchipDate;
    }

    public void setMicrochipDate(LocalDate microchipDate) {
        this.microchipDate = microchipDate;
    }

    public Boolean getIsSterilized() {
        return isSterilized;
    }

    public void setIsSterilized(Boolean isSterilized) {
        this.isSterilized = isSterilized;
    }

    public LocalDate getSterilizationDate() {
        return sterilizationDate;
    }

    public void setSterilizationDate(LocalDate sterilizationDate) {
        this.sterilizationDate = sterilizationDate;
    }

    public Float getWeight() {
        return weight;
    }

    public void setWeight(Float weight) {
        this.weight = weight;
    }

    public Boolean getIsDeceased() {
        return isDeceased;
    }

    public void setIsDeceased(Boolean isDeceased) {
        this.isDeceased = isDeceased;
    }
}
