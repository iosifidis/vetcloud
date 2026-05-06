package com.pims.backend.service.impl;

import com.pims.backend.dto.ClientRequest;
import com.pims.backend.entity.Client;
import com.pims.backend.repository.ClientRepository;
import com.pims.backend.service.ClientService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    public ClientServiceImpl(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Override
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @Override
    public Optional<Client> getClientById(Long id) {
        return clientRepository.findById(id);
    }

    @Override
    public Client createClient(ClientRequest request) {
        Client client = new Client();
        client.setFirstName(request.getFirstName());
        client.setLastName(request.getLastName());
        client.setEmail(request.getEmail());
        client.setAfm(request.getAfm());
        client.setAdt(request.getAdt());
        client.setPhone(request.getPhoneValue());
        client.setAddress(request.getAddress());
        client.setIsStrayCaretaker(request.getIsStrayCaretaker());
        client.setGdprConsent(request.getGdprConsent());
        return clientRepository.save(client);
    }

    @Override
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
}
