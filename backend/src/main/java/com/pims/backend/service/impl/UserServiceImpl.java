package com.pims.backend.service.impl;

import com.pims.backend.dto.auth.RegisterRequest;
import com.pims.backend.entity.AppUser;
import com.pims.backend.entity.Appointment;
import com.pims.backend.entity.Role;
import com.pims.backend.repository.AppUserRepository;
import com.pims.backend.repository.AppointmentRepository;
import com.pims.backend.repository.RoleRepository;
import com.pims.backend.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(AppUserRepository appUserRepository, RoleRepository roleRepository,
            AppointmentRepository appointmentRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.roleRepository = roleRepository;
        this.appointmentRepository = appointmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<AppUser> getAllUsers() {
        return appUserRepository.findAll();
    }

    @Override
    public List<AppUser> getVets() {
        return appUserRepository.findAll().stream()
                .filter(user -> user.getRole() != null
                        && (user.getRole().getName().equals("VET") || user.getRole().getName().equals("ROLE_VET")))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<AppUser> getUserById(Long id) {
        return appUserRepository.findById(id);
    }

    @Override
    public AppUser createUser(RegisterRequest request) {
        if (appUserRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        Role role = roleRepository.findByName("VET").orElseGet(() -> {
            Role newRole = new Role();
            newRole.setName("VET");
            return roleRepository.save(newRole);
        });

        AppUser user = new AppUser();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setIsActive(true);
        user.setRole(role);

        return appUserRepository.save(user);
    }

    @Override
    public AppUser updateUser(Long id, RegisterRequest request) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null)
            user.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            user.setLastName(request.getLastName());
        if (request.getEmail() != null)
            user.setEmail(request.getEmail());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return appUserRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        AppUser userToDelete = appUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find or create 'John Doe' user
        AppUser johnDoe = appUserRepository.findByUsername("john.doe")
                .orElseGet(() -> {
                    Role vetRole = roleRepository.findByName("VET").orElse(null);
                    AppUser jd = new AppUser();
                    jd.setUsername("john.doe");
                    jd.setPasswordHash(passwordEncoder.encode("dummy-password")); // Secure random or unused
                    jd.setFirstName("John");
                    jd.setLastName("Doe");
                    jd.setEmail("johndoe@clinic.com");
                    jd.setIsActive(false); // Dummy user shouldn't login
                    jd.setRole(vetRole);
                    return appUserRepository.save(jd);
                });

        // Reassign appointments
        List<Appointment> appointments = appointmentRepository.findByVetId(id);
        for (Appointment appt : appointments) {
            appt.setVet(johnDoe);
            appointmentRepository.save(appt);
        }

        appUserRepository.deleteById(id);
    }
}
