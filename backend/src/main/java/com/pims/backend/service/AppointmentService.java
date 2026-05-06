package com.pims.backend.service;

import com.pims.backend.dto.AppointmentRequest;
import com.pims.backend.entity.Appointment;
import java.util.List;
import java.util.Optional;

public interface AppointmentService {
    List<Appointment> getAllAppointments();

    Optional<Appointment> getAppointmentById(Long id);

    Optional<Appointment> getNextAppointment(String username);

    List<Appointment> searchAppointments(String query);

    List<Appointment> getAppointmentsByClient(Long clientId);

    List<Appointment> getAppointmentsByPatient(Long patientId);

    Appointment createAppointment(AppointmentRequest request);

    Appointment updateAppointment(Long id, AppointmentRequest request);

    void deleteAppointment(Long id);
}
