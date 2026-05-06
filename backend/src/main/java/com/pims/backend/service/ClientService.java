package com.pims.backend.service;

import com.pims.backend.dto.ClientRequest;
import com.pims.backend.entity.Client;
import java.util.List;
import java.util.Optional;

public interface ClientService {
    List<Client> getAllClients();

    Optional<Client> getClientById(Long id);

    Client createClient(ClientRequest request);

    void deleteClient(Long id);
}
