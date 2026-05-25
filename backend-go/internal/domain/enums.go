package domain

// Species represents the type of animal.
type Species string

const (
	SpeciesDog    Species = "DOG"
	SpeciesCat    Species = "CAT"
	SpeciesRabbit Species = "RABBIT"
	SpeciesBird   Species = "BIRD"
	SpeciesOther  Species = "OTHER"
)

// Sex represents the sex of an animal.
type Sex string

const (
	SexMale   Sex = "MALE"
	SexFemale Sex = "FEMALE"
)

// AppointmentStatus represents the lifecycle state of an appointment.
type AppointmentStatus string

const (
	AppointmentStatusScheduled  AppointmentStatus = "SCHEDULED"
	AppointmentStatusCheckedIn  AppointmentStatus = "CHECKED_IN"
	AppointmentStatusInProgress AppointmentStatus = "IN_PROGRESS"
	AppointmentStatusCompleted  AppointmentStatus = "COMPLETED"
	AppointmentStatusCancelled  AppointmentStatus = "CANCELLED"
	AppointmentStatusNoShow     AppointmentStatus = "NO_SHOW"
)

// AppointmentType represents the kind of appointment.
type AppointmentType string

const (
	AppointmentTypeExam        AppointmentType = "EXAM"
	AppointmentTypeSurgery     AppointmentType = "SURGERY"
	AppointmentTypeVaccination AppointmentType = "VACCINATION"
	AppointmentTypeGrooming    AppointmentType = "GROOMING"
	AppointmentTypeCheckup     AppointmentType = "CHECKUP"
	AppointmentTypeEmergency   AppointmentType = "EMERGENCY"
)

// ResourceType represents the type of clinic resource.
type ResourceType string

const (
	ResourceTypeRoom      ResourceType = "ROOM"
	ResourceTypeEquipment ResourceType = "EQUIPMENT"
)

// AlertType represents the type of patient alert.
type AlertType string

const (
	AlertTypeAllergy    AlertType = "ALLERGY"
	AlertTypeBehavioral AlertType = "BEHAVIORAL"
	AlertTypeMedical    AlertType = "MEDICAL"
	AlertTypeOther      AlertType = "OTHER"
)

// AlertSeverity represents the severity level of an alert.
type AlertSeverity string

const (
	AlertSeverityLow      AlertSeverity = "LOW"
	AlertSeverityMedium   AlertSeverity = "MEDIUM"
	AlertSeverityHigh     AlertSeverity = "HIGH"
	AlertSeverityCritical AlertSeverity = "CRITICAL"
)

// Role represents a user role name.
type Role string

const (
	RoleVet   Role = "VET"
	RoleAdmin Role = "ADMIN"
)
