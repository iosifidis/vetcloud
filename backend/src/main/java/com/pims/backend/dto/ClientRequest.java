package com.pims.backend.dto;

public class ClientRequest {
    // Client fields
    private String firstName;
    private String lastName;
    private String email;
    private String afm;
    private String adt;
    private String phone;
    private String phoneNumber; // Alternative field name from frontend
    private String address;
    private Boolean gdprConsent;
    private Boolean isStrayCaretaker;

    // Initial Pet fields (optional)
    private String petName;
    private String petSpecies; // DOG, CAT, RABBIT, BIRD, OTHER
    private String petBreed;
    private String petSex; // MALE, FEMALE

    public ClientRequest() {
    }

    public ClientRequest(String firstName, String lastName, String email, String afm, String adt, String phone,
            String phoneNumber, String address, Boolean gdprConsent, String petName, String petSpecies, String petBreed,
            String petSex) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.afm = afm;
        this.adt = adt;
        this.phone = phone;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.gdprConsent = gdprConsent;
        this.petName = petName;
        this.petSpecies = petSpecies;
        this.petBreed = petBreed;
        this.petSex = petSex;
    }

    // Helper method to get phone regardless of which field was sent
    public String getPhoneValue() {
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }
        return phone;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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

    public Boolean getIsStrayCaretaker() {
        return isStrayCaretaker;
    }

    public void setIsStrayCaretaker(Boolean isStrayCaretaker) {
        this.isStrayCaretaker = isStrayCaretaker;
    }

    public String getPetName() {
        return petName;
    }

    public void setPetName(String petName) {
        this.petName = petName;
    }

    public String getPetSpecies() {
        return petSpecies;
    }

    public void setPetSpecies(String petSpecies) {
        this.petSpecies = petSpecies;
    }

    public String getPetBreed() {
        return petBreed;
    }

    public void setPetBreed(String petBreed) {
        this.petBreed = petBreed;
    }

    public String getPetSex() {
        return petSex;
    }

    public void setPetSex(String petSex) {
        this.petSex = petSex;
    }
}
