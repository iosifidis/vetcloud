package com.pims.backend.service.impl;

import com.pims.backend.dto.PatientRequest;
import com.pims.backend.entity.Client;
import com.pims.backend.entity.Patient;
import com.pims.backend.enums.Sex;
import com.pims.backend.enums.Species;
import com.pims.backend.repository.ClientRepository;
import com.pims.backend.repository.PatientRepository;
import com.pims.backend.service.PatientService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final ClientRepository clientRepository;

    public PatientServiceImpl(PatientRepository patientRepository, ClientRepository clientRepository) {
        this.patientRepository = patientRepository;
        this.clientRepository = clientRepository;
    }

    @Override
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    @Override
    public List<Patient> getPatientsByOwnerId(Long ownerId) {
        return patientRepository.findByOwnerId(ownerId);
    }

    @Override
    public Patient createPatient(Long clientId, PatientRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Patient patient = new Patient();
        patient.setName(request.getName());
        if (request.getSpecies() != null) {
            patient.setSpecies(Species.valueOf(request.getSpecies().toUpperCase()));
        }
        patient.setBreed(request.getBreed());
        if (request.getSex() != null) {
            patient.setSex(Sex.valueOf(request.getSex().toUpperCase()));
        }
        patient.setBirthDate(request.getBirthDate());
        patient.setIsDateOfBirthApproximate(request.getIsDateOfBirthApproximate());
        patient.setMicrochipNumber(request.getMicrochipNumber());
        patient.setMicrochipDate(request.getMicrochipDate());
        patient.setIsSterilized(request.getIsSterilized());
        patient.setSterilizationDate(request.getSterilizationDate());
        patient.setWeight(request.getWeight());
        if (request.getIsDeceased() != null) {
            patient.setIsDeceased(request.getIsDeceased());
        }

        patient.setOwner(client);

        return patientRepository.save(patient);
    }

    @Override
    public Patient updatePatient(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));

        if (request.getName() != null)
            patient.setName(request.getName());
        if (request.getBreed() != null)
            patient.setBreed(request.getBreed());
        if (request.getBirthDate() != null)
            patient.setBirthDate(request.getBirthDate());
        if (request.getIsDateOfBirthApproximate() != null)
            patient.setIsDateOfBirthApproximate(request.getIsDateOfBirthApproximate());
        if (request.getMicrochipNumber() != null)
            patient.setMicrochipNumber(request.getMicrochipNumber());
        if (request.getMicrochipDate() != null)
            patient.setMicrochipDate(request.getMicrochipDate());
        if (request.getIsSterilized() != null)
            patient.setIsSterilized(request.getIsSterilized());
        if (request.getSterilizationDate() != null)
            patient.setSterilizationDate(request.getSterilizationDate());
        if (request.getWeight() != null)
            patient.setWeight(request.getWeight());
        if (request.getIsDeceased() != null)
            patient.setIsDeceased(request.getIsDeceased());

        if (request.getSpecies() != null) {
            try {
                patient.setSpecies(Species.valueOf(request.getSpecies().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid enum values or handle error
            }
        }
        if (request.getSex() != null) {
            try {
                patient.setSex(Sex.valueOf(request.getSex().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid enum values
            }
        }

        return patientRepository.save(patient);
    }

    @Override
    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    @Override
    public Patient transferPatient(Long patientId, Long newOwnerId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Client newOwner = clientRepository.findById(newOwnerId)
                .orElseThrow(() -> new RuntimeException("New owner not found"));

        patient.setOwner(newOwner);
        return patientRepository.save(patient);
    }
}
