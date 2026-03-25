# TeamC: Military-Themed Web Application

TeamC is a comprehensive web platform designed for military personnel and enthusiasts. It provides features ranging from a PX shopping mall and daily meal tracking to military news and recruitment information.

## Project Overview

-   **Goal:** Provide a centralized hub for military-related services (PX shopping, meals, news, recruitment, discharge calculator).
-   **Architecture:**
    -   **Frontend:** React (TypeScript) with `react-scripts`. Uses `Zustand` for state management and `Supabase` for authentication and database interactions.
    -   **Backend:** FastAPI (Python) for API endpoints, integrating with Naver News API and Cloudflare Workers KV for meal data.
    -   **Database:** Supabase (PostgreSQL) and Storage for product images.
    -   **External Integrations:** Naver News/Image API, Kakao/Naver/Google Social Login, PortOne (Payments), Cloudflare Workers (Meal Data).

## Core Features

1.  **PX Shopping Mall (`/`):** List PX-exclusive food items with calorie info and simulated payment.
2.  **Meal Dashboard (`/Dashboard`):** Daily/weekly military meal plans with calorie tracking.
3.  **Military News (`/news`):** Real-time defense industry news using Naver API.
4.  **Recruitment (`/Recruitment`):** Military recruitment info and application status.
5.  **Reserve Forces (`/Armed-Reserve`):** Interactive map for reserve training locations.
6.  **Discharge Calculator:** Personal military service progress tracker.

## Getting Started

### Backend (FastAPI)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### Frontend (React)

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm start
    ```

## Development Conventions

-   **Frontend:**
    -   **Components:** Functional components with TypeScript. Common UI in `src/components/common`, layout in `src/components/layout`.
    -   **Features:** Logic organized by feature (e.g., `src/features/shop`, `src/features/meal`).
    -   **State:** Use `src/store` for global state (Zustand).
    -   **Styling:** Prefer Vanilla CSS and CSS modules. Theme variables in `src/styles/theme.ts`.
-   **Backend:**
    -   **API:** Versioned endpoints in `app/api/v1/`.
    -   **Models/Schemas:** Pydantic for data validation (`schemas/`), SQLAlchemy for ORM (`models/`).
    -   **Services:** Business logic isolated in `services/`.
-   **Design:** Refer to the `stitch/` directory for original design mocks (HTML/PNG) provided by the user.

## Environment Variables (.env)

Ensure `.env` files are correctly set up in both `frontend` and `backend` directories.
-   **Backend:** Database URL, Naver API keys, Cloudflare KV credentials.
-   **Frontend:** Supabase URL, Anon Key, API endpoints.
*(Note: Do not commit `.env` files. Refer to `.env.example` if available.)*
