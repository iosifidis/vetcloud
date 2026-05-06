# MSc PIMS - Practice Information Management System

This project is a full-stack web application designed for managing patient information, likely within a veterinary or medical context. It is composed of a decoupled architecture with a Spring Boot backend, a React-based frontend, and a PostgreSQL database.

## 📂 Project Structure

The codebase is organized into three main directories:

*   **`backend`**: A Spring Boot application (Java 21) that serves as the REST API, handling business logic, data persistence, and security.
*   **`frontend`**: A React application (powered by Vite) that provides the user interface.
*   **`database`**: Contains Docker configurations to easily spin up the required PostgreSQL database.

---

## 🛠️ Technology Stack

### Backend
*   **Framework**: [Spring Boot 3.4.1](https://spring.io/projects/spring-boot)
*   **Language**: Java 21
*   **Build Tool**: Maven (Wrapper included)
*   **Database Interaction**: Spring Data JPA, Hibernate
*   **Security**: Spring Security, JWT (JSON Web Tokens)
*   **Testing**: JUnit, Mockito, Jacoco

### Frontend
*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Routing**: React Router DOM
*   **HTTP Client**: Axios
*   **Calendar**: FullCalendar
*   **Date Utils**: date-fns

### Database
*   **System**: PostgreSQL 16 (running via Docker)

---

## 🚀 Getting Started

Follow these instructions to get the complete system up and running on your local machine.

### Prerequisites
Ensure you have the following installed:
*   [Java SDK 21](https://adoptium.net/)
*   [Node.js](https://nodejs.org/) (LTS version recommended) & npm
*   [Docker](https://www.docker.com/) & Docker Compose

---

### Step 1: Start the Database

The project uses a containerized PostgreSQL database.

1.  Navigate to the `database` directory:
    ```bash
    cd database
    ```
2.  Start the database container:
    ```bash
    docker-compose up -d
    ```
3.  Verify it's running:
    ```bash
    docker ps
    ```
    You should see a container named `pims_db` running on port `5432`.

    > **Note**: The default credentials are configured in `docker-compose.yml` and `application.properties`:
    > *   User: `admin`
    > *   Password: `password123`
    > *   Database: `pims_db`

---

### Step 2: Run the Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd ../backend
    ```
2.  (Optional) Clean and build the project to ensure dependencies are downloaded:
    ```bash
    ./mvnw clean install
    ```
3.  Start the Spring Boot application:
    ```bash
    ./mvnw spring-boot:run
    ```
    
    The backend server will start (by default on **http://localhost:8080**).
    
    > **⚠️ Important**: The current configuration uses `spring.jpa.hibernate.ddl-auto=create-drop`. This means **data is lost** every time you restart the backend application. Change this to `update` in `backend/src/main/resources/application.properties` to persist data.

---

### Step 3: Run the Frontend

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the JavaScript dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

    The frontend will start (usually on **http://localhost:5173**). Open this URL in your browser to access the application.

---

## 🧪 Running Tests

### Backend Tests
To run unit and integration tests for the backend:
```bash
cd backend
./mvnw test
```
Reports (e.g., Jacoco) will be generated in `backend/target/site/jacoco`.

### Frontend Linting
To run linting for the frontend:
```bash
cd frontend
npm run lint
```
