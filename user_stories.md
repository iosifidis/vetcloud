# User Stories - Veterinary Practice Management System (PIMS)

This document outlines the user stories for the Veterinary Practice Management System (PIMS), derived from an analysis of the existing codebase.

## 1. User Roles

*   **Veterinarian (Vet)**: The primary medical user who manages patient care, appointments, and medical records.
*   **Administrator (Admin)**: A user with elevated privileges to manage system settings, users, and core configurations.

> **Note**: The codebase currently defines `ROLE_VET` and `ROLE_ADMIN` in `DataInitializer.java`.

---

## 2. Authentication & User Management

### 2.1. Authentication
*   **US-1.1**: As a **User**, I want to **log in** with my username and password so that I can access the system securely.
    *   *System Implementation*: JWT-based authentication (`AuthController`, `JwtService`).
*   **US-1.2**: As a **User**, I want to **register** a new account (if enabled) so that I can access the system.
    *   *System Implementation*: Registration endpoint exists (`/auth/register`), but likely restricted or for testing.

### 2.2. Profile Management
*   **US-1.3**: As a **Vet**, I want to **view and update my profile** (email, name) so that my information is correct.
    *   *System Implementation*: `ProfilePage.jsx`, `UserController`.

### 2.3. User Administration (Admin Only)
*   **US-1.4**: As an **Admin**, I want to **view a list of all users** so that I can manage staff access.
*   **US-1.5**: As an **Admin**, I want to **create or deactivate users** so that I can control who has access to the system.
    *   *System Implementation*: `UsersPage.jsx`, `UserController`.

---

## 3. Client Management

### 3.1. Client CRUD
*   **US-2.1**: As a **Vet**, I want to **create a new Client** (pet owner) with their contact details (Name, Email, Phone, AFM, Address) so that I can link them to their pets.
    *   *System Implementation*: `ClientForm.jsx`, `ClientController`.
*   **US-2.2**: As a **Vet**, I want to **view a list of Clients** so that I can find a specific owner.
    *   *System Implementation*: `ClientsPage.jsx` with search functionality.
*   **US-2.3**: As a **Vet**, I want to **search for a Client** by name or phone number so that I can quickly access their file.
    *   *System Implementation*: `ClientSearchDropdown.jsx`, search logic in backend.
*   **US-2.4**: As a **Vet**, I want to **update Client details** so that their contact information stays current.

### 3.2. Special Roles
*   **US-2.5**: As a **Vet**, I want to **mark a Client as a "Stray Animal Caretaker"** so that we can distinguish between standard owners and stray animal volunteers.
    *   *System Implementation*: `isStrayCaretaker` flag in `Client` entity.

---

## 4. Patient Management

### 4.1. Patient CRUD
*   **US-3.1**: As a **Vet**, I want to **add a new Patient** to a Client so that I can start tracking their medical history.
    *   *System Implementation*: `PatientController`, linked to `Client`.
*   **US-3.2**: As a **Vet**, I want to **record patient details** including Species (Dog/Cat), Breed, Sex, Birth Date, and Weight so that I have a complete profile.
    *   *System Implementation*: `Patient` entity attributes.
*   **US-3.3**: As a **Vet**, I want to **view a list of Patients** so that I can see the practice's animal registry.
    *   *System Implementation*: `PatientsPage.jsx`.

### 4.2. Identification & Status
*   **US-3.4**: As a **Vet**, I want to **record Microchip information** (Number and Date) so that the animal is permanently identified.
*   **US-3.5**: As a **Vet**, I want to **mark a Patient's Date of Birth as "Approximate"** so that I can estimate age when the exact date is unknown.
    *   *System Implementation*: `isDateOfBirthApproximate` flag.
*   **US-3.6**: As a **Vet**, I want to **record Sterilization status** and date so that I know the animal's reproductive status.
*   **US-3.7**: As a **Vet**, I want to **flag a Patient as Deceased** so that we stop sending reminders or booking appointments.

---

## 5. Appointment Management

### 5.1. Scheduling
*   **US-4.1**: As a **Vet**, I want to **view a Calendar** of appointments so that I can see the daily/weekly schedule.
    *   *System Implementation*: `CalendarPage.jsx`, `FullCalendar` integration.
*   **US-4.2**: As a **Vet**, I want to **book a new Appointment** for a specific Client and Patient so that we can reserve time for care.
    *   *System Implementation*: `AppointmentForm.jsx`, `AppointmentController`.
*   **US-4.3**: As a **Vet**, I want to **specify the Appointment Type** (e.g., Exam, Vaccination, Surgery) so that we know how to prepare.
    *   *System Implementation*: `AppointmentType` enum.

### 5.2. Management
*   **US-4.4**: As a **Vet**, I want to **update the status** of an appointment (e.g., Scheduled, Completed, Cancelled) so that we can track workflow.
*   **US-4.5**: As a **Vet**, I want to **view upcoming appointments** on a Dashboard so that I know what to do next.
    *   *System Implementation*: `DashboardPage.jsx`, `DashboardController`.

---

## 6. Medical Records & History

### 6.1. Clinical Notes
*   **US-5.1**: As a **Vet**, I want to **add Medical Records** (SOAP notes, diagnoses, treatments) to a patient's file so that there is a permanent clinical history.
    *   *System Implementation*: `MedicalRecordController`, `MedicalRecord` entity.
*   **US-5.2**: As a **Vet**, I want to **view the Patient History** timeline so that I can see past treatments and visits.
    *   *System Implementation*: `PatientHistory.jsx`, `PatientHistoryModal.jsx`.

### 6.2. Alerts
*   **US-5.3**: As a **Vet**, I want to **add Alerts** to a Patient (e.g., "Aggressive", "Allergic to Penicillin") so that staff are warned of critical information.
    *   *System Implementation*: `Alert` entity linked to `Patient`.

---

## 7. Dashboard & Analytics

*   **US-6.1**: As a **Vet**, I want to **view Key Performance Indicators** (Total Patients, Today's Appointments, Revenue) on a dashboard so that I can monitor practice health.
    *   *System Implementation*: `DashboardStats` DTO, `DashboardHome.jsx`.
