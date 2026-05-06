package com.pims.backend.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String afm;

    private String adt;

    @JsonProperty("phoneNumber") // Serialize as phoneNumber for frontend compatibility
    private String phone;

    private String address;

    @Column(name = "gdpr_consent")
    private Boolean gdprConsent;

    @Column(nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<Patient> pets = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Appointment> appointments = new ArrayList<>();

    @Column(name = "is_stray_caretaker")
    private Boolean isStrayCaretaker = false;

    public Client() {
    }

    public Client(Long id, String firstName, String lastName, String email, String afm, String adt, String phone,
            String address, Boolean gdprConsent, BigDecimal balance, List<Patient> pets) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.afm = afm;
        this.adt = adt;
        this.phone = phone;
        this.address = address;
        this.gdprConsent = gdprConsent;
        this.balance = balance;
        this.pets = pets;
    }

    @PrePersist
    public void prePersist() {
        if (balance == null) {
            balance = BigDecimal.ZERO;
        }
    }

    public void addPatient(Patient patient) {
        pets.add(patient);
        patient.setOwner(this);
    }

    public void removePatient(Patient patient) {
        pets.remove(patient);
        patient.setOwner(null);
    }

    @JsonProperty("petCount")
    public int getPetCount() {
        return pets != null ? pets.size() : 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAfm() {
        return afm;
    }

    public void setAfm(String afm) {
        this.afm = afm;
    }

    public String getAdt() {
        return adt;
    }

    public void setAdt(String adt) {
        this.adt = adt;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Boolean getGdprConsent() {
        return gdprConsent;
    }

    public void setGdprConsent(Boolean gdprConsent) {
        this.gdprConsent = gdprConsent;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public List<Patient> getPets() {
        return pets;
    }

    public void setPets(List<Patient> pets) {
        this.pets = pets;
    }

    public Boolean getIsStrayCaretaker() {
        return isStrayCaretaker;
    }

    public void setIsStrayCaretaker(Boolean isStrayCaretaker) {
        this.isStrayCaretaker = isStrayCaretaker;
    }
}
