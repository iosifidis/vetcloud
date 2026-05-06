package com.pims.backend.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.pims.backend.entity.AppUser;
import com.pims.backend.entity.Appointment;
import com.pims.backend.entity.Client;
import com.pims.backend.entity.Patient;
import com.pims.backend.entity.Role;
import com.pims.backend.enums.AppointmentStatus;
import com.pims.backend.enums.AppointmentType;
import com.pims.backend.enums.Sex;
import com.pims.backend.enums.Species;
import com.pims.backend.repository.AppUserRepository;
import com.pims.backend.repository.AppointmentRepository;
import com.pims.backend.repository.ClientRepository;
import com.pims.backend.repository.PatientRepository;
import com.pims.backend.repository.RoleRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final ClientRepository clientRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AppUserRepository appUserRepository,
            RoleRepository roleRepository,
            ClientRepository clientRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.roleRepository = roleRepository;
        this.clientRepository = clientRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Prevent duplication on restart
        if (roleRepository.count() > 0) {
            return;
        }

        // 1. Create Roles
        Role vetRole = new Role();
        vetRole.setName("VET");
        vetRole.setPermissions(new HashSet<>(Set.of("READ_PATIENT", "WRITE_PATIENT", "CREATE_APPOINTMENT")));
        roleRepository.save(vetRole);

        Role adminRole = new Role();
        adminRole.setName("ROLE_ADMIN");
        adminRole.setPermissions(new HashSet<>(Set.of("ADMIN_ACCESS")));
        roleRepository.save(adminRole);

        // 2. Create 2 Vets
        AppUser vet1 = new AppUser();
        vet1.setUsername("vet1");
        vet1.setPasswordHash(passwordEncoder.encode("password"));
        vet1.setEmail("vet1@pims.com");
        vet1.setFirstName("John");
        vet1.setLastName("Doe");
        vet1.setIsActive(true);
        vet1.setRole(vetRole);
        appUserRepository.save(vet1);

        AppUser vet2 = new AppUser();
        vet2.setUsername("vet2");
        vet2.setPasswordHash(passwordEncoder.encode("password"));
        vet2.setEmail("vet2@pims.com");
        vet2.setFirstName("Jane");
        vet2.setLastName("Smith");
        vet2.setIsActive(true);
        vet2.setRole(vetRole);
        appUserRepository.save(vet2);

        // 3. Create 2 Clients
        Client client1 = new Client();
        client1.setFirstName("Alice");
        client1.setLastName("Johnson");
        client1.setEmail("alice@example.com");
        client1.setPhone("555-0101");
        client1.setAddress("123 Maple St");
        client1.setAfm("111222333");
        client1.setGdprConsent(true);
        client1.setBalance(BigDecimal.ZERO);
        clientRepository.save(client1);

        Client client2 = new Client();
        client2.setFirstName("Bob");
        client2.setLastName("Williams");
        client2.setEmail("bob@example.com");
        client2.setPhone("555-0102");
        client2.setAddress("456 Oak Ave");
        client2.setAfm("444555666");
        client2.setGdprConsent(true);
        client2.setBalance(BigDecimal.ZERO);
        clientRepository.save(client2);

        // 4. Create Patients (1 for each client)
        Patient patient1 = new Patient();
        patient1.setName("Buddy");
        patient1.setSpecies(Species.DOG);
        patient1.setBreed("Golden Retriever");
        patient1.setSex(Sex.MALE);
        patient1.setBirthDate(LocalDate.of(2020, 5, 10));
        patient1.setWeight(25.5f);
        patient1.setMicrochipNumber("900111222333444");
        patient1.setOwner(client1);
        patientRepository.save(patient1);

        Patient patient2 = new Patient();
        patient2.setName("Whiskers");
        patient2.setSpecies(Species.CAT);
        patient2.setBreed("Siamese");
        patient2.setSex(Sex.FEMALE);
        patient2.setBirthDate(LocalDate.of(2019, 8, 15));
        patient2.setWeight(4.2f);
        patient2.setMicrochipNumber("900555666777888");
        patient2.setOwner(client2);
        patientRepository.save(patient2);

        // 5. Create Appointments
        Appointment appt1 = new Appointment();
        appt1.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
        appt1.setEndTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(30));
        appt1.setStatus(AppointmentStatus.SCHEDULED);
        appt1.setType(AppointmentType.EXAM);
        appt1.setReason("Annual Checkup");
        appt1.setClient(client1);
        appt1.setPatient(patient1);
        appt1.setVet(vet1);
        appointmentRepository.save(appt1);

        Appointment appt2 = new Appointment();
        appt2.setStartTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(0));
        appt2.setEndTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(30));
        appt2.setStatus(AppointmentStatus.SCHEDULED);
        appt2.setType(AppointmentType.VACCINATION);
        appt2.setReason("Rabies Vaccination");
        appt2.setClient(client2);
        appt2.setPatient(patient2);
        appt2.setVet(vet2);
        appointmentRepository.save(appt2);
    }
}
