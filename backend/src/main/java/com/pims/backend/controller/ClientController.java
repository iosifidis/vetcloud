package com.pims.backend.controller;

import com.pims.backend.dto.ClientRequest;
import com.pims.backend.dto.PatientRequest;
import com.pims.backend.entity.Client;
import com.pims.backend.entity.Patient;
import com.pims.backend.service.ClientService;
import com.pims.backend.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;
    private final PatientService patientService;

    public ClientController(ClientService clientService, PatientService patientService) {
        this.clientService = clientService;
        this.patientService = patientService;
    }

    @GetMapping
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    @PostMapping
    public ResponseEntity<Client> createClient(@RequestBody ClientRequest request) {
        Client savedClient = clientService.createClient(request);
        return ResponseEntity.ok(savedClient);
    }

    @PostMapping("/{clientId}/patients")
    public ResponseEntity<Patient> addPatient(@PathVariable Long clientId, @RequestBody PatientRequest request) {
        try {
            Patient savedPatient = patientService.createPatient(clientId, request);
            return ResponseEntity.ok(savedPatient);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        try {
            clientService.deleteClient(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
