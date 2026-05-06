package com.pims.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.pims.backend.enums.Sex;
import com.pims.backend.enums.Species;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_dob_approximate")
    private Boolean isDateOfBirthApproximate = false;

    @Column(name = "microchip_number", unique = true, length = 15)
    private String microchipNumber;

    @Column(name = "microchip_date")
    private LocalDate microchipDate;

    @Column(name = "is_sterilized")
    private Boolean isSterilized;

    @Column(name = "sterilization_date")
    private LocalDate sterilizationDate;

    private Float weight;

    @Column(name = "is_deceased")
    private Boolean isDeceased = false;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Species species;

    @Enumerated(EnumType.STRING)
    private Sex sex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonBackReference
    private Client owner;

    public Patient() {
    }

    public Patient(Long id, String name, String breed, LocalDate birthDate, String microchipNumber,
            LocalDate microchipDate, Boolean isSterilized, LocalDate sterilizationDate, Float weight,
            Boolean isDeceased, Species species, Sex sex, Client owner) {
        this.id = id;
        this.name = name;
        this.breed = breed;
        this.birthDate = birthDate;
        this.microchipNumber = microchipNumber;
        this.microchipDate = microchipDate;
        this.isSterilized = isSterilized;
        this.sterilizationDate = sterilizationDate;
        this.weight = weight;
        this.isDeceased = isDeceased;
        this.species = species;
        this.sex = sex;
        this.owner = owner;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
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

    public Species getSpecies() {
        return species;
    }

    public void setSpecies(Species species) {
        this.species = species;
    }

    public Sex getSex() {
        return sex;
    }

    public void setSex(Sex sex) {
        this.sex = sex;
    }

    public Client getOwner() {
        return owner;
    }

    public void setOwner(Client owner) {
        this.owner = owner;
    }
}
