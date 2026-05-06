package com.pims.backend.dto;

import java.math.BigDecimal;

public class DashboardStats {
    private long totalPatients;
    private long totalAppointments;
    private long appointmentsToday;
    private BigDecimal totalRevenue;

    public DashboardStats() {
    }

    public DashboardStats(long totalPatients, long totalAppointments, long appointmentsToday, BigDecimal totalRevenue) {
        this.totalPatients = totalPatients;
        this.totalAppointments = totalAppointments;
        this.appointmentsToday = appointmentsToday;
        this.totalRevenue = totalRevenue;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getAppointmentsToday() {
        return appointmentsToday;
    }

    public void setAppointmentsToday(long appointmentsToday) {
        this.appointmentsToday = appointmentsToday;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
