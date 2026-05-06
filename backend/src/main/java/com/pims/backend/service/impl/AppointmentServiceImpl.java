package com.pims.backend.service.impl;

import com.pims.backend.dto.AppointmentRequest;
import com.pims.backend.entity.*;
import com.pims.backend.enums.AppointmentStatus;
import com.pims.backend.repository.*;
import com.pims.backend.service.AppointmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final PatientRepository patientRepository;
    private final AppUserRepository appUserRepository;
    private final ResourceRepository resourceRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
            ClientRepository clientRepository,
            PatientRepository patientRepository,
            AppUserRepository appUserRepository,
            ResourceRepository resourceRepository) {
        this.appointmentRepository = appointmentRepository;
        this.clientRepository = clientRepository;
        this.patientRepository = patientRepository;
        this.appUserRepository = appUserRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Override
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    @Override
    public Optional<Appointment> getNextAppointment(String username) {
        AppUser vet = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Vet user not found"));

        Appointment nextAppointment = appointmentRepository.findFirstByVetIdAndStartTimeAfterOrderByStartTimeAsc(
                vet.getId(), LocalDateTime.now());

        return Optional.ofNullable(nextAppointment);
    }

    @Override
    public List<Appointment> searchAppointments(String query) {
        return appointmentRepository.searchAppointments(query);
    }

    @Override
    public List<Appointment> getAppointmentsByClient(Long clientId) {
        return appointmentRepository.findByClientId(clientId);
    }

    @Override
    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    @Override
    public Appointment createAppointment(AppointmentRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        AppUser vet = appUserRepository.findById(request.getVetId())
                .orElseThrow(() -> new RuntimeException("Vet not found"));

        Resource resource = null;
        if (request.getResourceId() != null) {
            resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new RuntimeException("Resource not found"));
        }

        Appointment appointment = new Appointment();
        appointment.setClient(client);
        appointment.setPatient(patient);
        appointment.setVet(vet);
        appointment.setResource(resource);
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setNotes(request.getNotes());
        appointment.setReason(request.getReason());
        appointment.setType(request.getType());
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment updateAppointment(Long id, AppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Task Locking Logic (US 3.4)
        if (appointment.getStartTime().isBefore(LocalDateTime.now())) {
            // It's a past appointment. It is LOCKED unless we are rescheduling it to the
            // future.
            boolean isReschedulingToFuture = request.getStartTime() != null &&
                    request.getStartTime().isAfter(LocalDateTime.now());

            if (!isReschedulingToFuture) {
                // If not rescheduling to future, we can only edit if it's NOT completed and we
                // are completing it (status change)
                // But generally, US 3.4 says "only be able to unlock/edit them if I reschedule
                // them".
                // We will allow status updates (e.g. for completion) but block other content
                // edits if not rescheduling.

                // Assuming status update is handled separately or we allow it.
                // Let's being strict: If start time is past, and we are NOT moving it to
                // future, throw exception.
                // However, US 3.5 says "Examine" modal saves and sets status to Completed. That
                // is an update.
                // So we must allow updates if the STATUS is changing to COMPLETED (via Medical
                // Record usually, but here via API?)
                // The AppointmentService update is general.

                // Refined Rule: Block editing details of past appointments, EXCEPT status
                // updates or Rescheduling.

                // For now, let's stick to the prompt's specific requirement: "Only be able to
                // unlock/edit them if I reschedule"
                throw new RuntimeException(
                        "Past appointments are locked. You must reschedule to a future date to edit.");
            }
        }

        if (request.getClientId() != null) {
            appointment.setClient(clientRepository.findById(request.getClientId()).orElseThrow());
        }
        if (request.getPatientId() != null) {
            appointment.setPatient(patientRepository.findById(request.getPatientId()).orElseThrow());
        }
        if (request.getVetId() != null) {
            appointment.setVet(appUserRepository.findById(request.getVetId()).orElseThrow());
        }
        if (request.getResourceId() != null) {
            appointment.setResource(resourceRepository.findById(request.getResourceId()).orElseThrow());
        }
        if (request.getStartTime() != null)
            appointment.setStartTime(request.getStartTime());
        if (request.getEndTime() != null)
            appointment.setEndTime(request.getEndTime());
        if (request.getNotes() != null)
            appointment.setNotes(request.getNotes());
        if (request.getReason() != null)
            appointment.setReason(request.getReason());
        if (request.getType() != null)
            appointment.setType(request.getType());

        return appointmentRepository.save(appointment);
    }

    @Override
    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found");
        }
        appointmentRepository.deleteById(id);
    }
}
