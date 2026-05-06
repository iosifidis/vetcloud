package com.pims.backend.controller;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pims.backend.entity.Appointment;
import com.pims.backend.repository.AppointmentRepository;
import com.pims.backend.repository.PatientRepository;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    public DashboardController(PatientRepository patientRepository, AppointmentRepository appointmentRepository) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Patient stats
        stats.put("totalPatients", patientRepository.count());

        // Appointment stats
        List<Appointment> appointments = appointmentRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        LocalDateTime startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).with(LocalTime.MIN);
        LocalDateTime endOfWeek = now.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).with(LocalTime.MAX);

        long appointmentsToday = appointments.stream()
                .filter(a -> a.getStartTime().toLocalDate().isEqual(today))
                .count();

        long appointmentsWeek = appointments.stream()
                .filter(a -> !a.getStartTime().isBefore(startOfWeek) && !a.getStartTime().isAfter(endOfWeek))
                .count();

        stats.put("appointmentsToday", appointmentsToday);
        stats.put("appointmentsWeek", appointmentsWeek);
        stats.put("totalAppointments", appointments.size());

        // Revenue (hardcoded as requested)
        stats.put("totalRevenue", 0.0);

        return ResponseEntity.ok(stats);
    }
}
