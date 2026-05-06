package com.pims.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pims.backend.entity.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    long countByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    boolean existsByVetIdAndStartTimeBetween(Long vetId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE " +
            "LOWER(a.client.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.client.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.client.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.patient.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.reason) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Appointment> searchAppointments(@Param("query") String query);

    List<Appointment> findByClientId(Long clientId);

    List<Appointment> findByPatientId(Long patientId);

    Appointment findFirstByVetIdAndStartTimeAfterOrderByStartTimeAsc(Long vetId, LocalDateTime startTime);

    List<Appointment> findByVetId(Long vetId);
}
