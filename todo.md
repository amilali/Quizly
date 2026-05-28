# Smart Quiz AI Hub - Project Analysis & Todo List
# App name: Qwizly
# Make frontend and backend in seprate folders

## Image Analysis
- **Image 1 (#1.jpeg) - Problem Statement (Current State):** Describes the current problem at ATCI where SMEs use external tools for quizzes, leading to fragmented learning, lack of customization, and missing analytics. The core goal is to build a centralized and customizable platform.
- **Image 2 (#2.jpeg) - Problem Statement (Requirements):** Outlines the Level-1 goal: "Smart Quiz AI Hub". It lists detailed SME Interface Requirements (MCQ Creation, Status Tracking, Updates/Revisions, Review/Approval) and Admin Interface Requirements (Super-user capabilities, assigning MCQs).
- **Image 3 (#3.jpeg) - MCQ Lifecycle:** Defines the precise state machine an MCQ goes through: `Draft` -> `Ready for Review` -> `Under Review` -> `Approved` or `Rejected`.
- **Image 4 (#4.jpeg) - Technology Stack:** Specifies the mandatory technical stack. Backend: Java (OpenJDK 8+), Spring Framework, SQL/NoSQL Database, AI Integration via Spring AI. Frontend: ReactJS or AngularJS.
- **Image 5 (#5.jpeg) - SME Functionality (Update Question):** Shows UI wireframes for SMEs to view "My Questions" in a paginated table and an "Edit" form for updating questions. It explains how to save as draft vs save & send for review.
- **Image 6 (#6.jpeg) - SME Functionality (Add Single Question):** Shows the UI flow starting from an "Add Question" button, prompting a choice between UI entry and Bulk Upload. Details the individual question entry form fields (Stem, Tech Stack, Topic, Difficulty, 4 Options, Correct Answer).
- **Image 7 (#7.jpeg) - SME Functionality (Upload Bulk Questions):** Displays the UI and logic for the Excel/CSV Bulk Upload feature. Highlights validation requirements and how imported questions start in the "Draft" state.
- **Image 8 (#8.jpeg) - SME Functionality (Review Questions):** Details the "My Pending Review" tab for assigned reviewers. It shows a detailed view for reviewing a question, adding mandatory feedback, and acting to Approve or Reject.
- **Image 9 (#9.jpeg) - Admin Functionality (Standard):** Clarifies that Admins possess all standard SME capabilities and use the exact same interfaces for their own questions and reviews.
- **Image 10 (#10.jpeg) - Admin Functionality (Question Bank Management):** Shows the "Question Bank Management" tab exclusive to Admins. It displays how Admins can click "Assign Reviewer" to open a modal that filters and assigns a qualified SME based on the technology stack, ensuring no self-review.
- **Image 11 (#11.jpeg) - Assumptions:** Lists foundational assumptions: Two user roles (SME, Admin), existence of master data for tech stacks/topics in the DB, and mapping of SMEs to their specific tech skills.
- **Image 12 (#12.jpeg) - Sample Data:** Provides a concrete tabular structure of sample quiz question data in the database, defining columns like `Question_id`, `Question_Stem`, `Option_A` to `D`, `Correct_answer`, `Difficulty`, `Stack_id`, `Topic_id`, `E_id` (Creator), and `status`.

## Project Todo List

### Phase 1: Planning and Setup
- [ ] Initialize Backend Project (Java + Spring Boot).
- [ ] Initialize Frontend Project (ReactJS or AngularJS).
- [ ] Set up Database (PostgreSQL/MySQL or MongoDB/Cassandra).
- [ ] Define database schema for Users, Roles (SME, Admin), Technology Stacks, Topics, and Questions (reference Image 12 for schema design).
- [ ] Seed database with mock master data (Topics, Tech Stacks, list of SMEs with associated skills).

### Phase 2: Backend Development (APIs)
- [ ] **Authentication & Roles:** Implement user login and role-based access control (SME vs Admin).
- [ ] **Question Management (CRUD):** Create APIs to add, get, update, and delete questions.
- [ ] **MCQ Lifecycle:** Implement business logic to enforce the state machine (`Draft` -> `Ready for Review` -> `Under Review` -> `Approved` / `Rejected`).
- [ ] **Bulk Upload API:** Implement Excel/CSV parsing and validation to allow creating multiple questions in `Draft` state.
- [ ] **Review API:** Implement endpoints for reviewer SMEs to submit feedback and change status to `Approved` or `Rejected`.
- [ ] **Admin API:** Implement endpoints for Admins to fetch the entire Question Bank and assign a reviewer SME (with validation to prevent self-review and ensure skill match).
- [ ] **AI Integration:** Integrate Spring AI for question generation and similarity detection.

### Phase 3: Frontend Development (UI Components - SME)
- [ ] **Base Layout & Routing:** Setup Navigation sidebar/tabs (`Question Bank Management` (Admin only), `My Pending Reviews`, `My Questions`).
- [ ] **My Questions View:** Build a paginated data table displaying the logged-in user's questions with current status and action buttons.
- [ ] **Add Question Flow:** 
  - Build the entry selection modal (UI vs Bulk).
  - Build the Single Question entry form (Question Stem, Tech Stack, Topic, Difficulty, Options, Correct Answer).
  - Build the Bulk Upload interface with template download and drag-and-drop file upload.
- [ ] **Edit Question Form:** Build form to modify questions in `Draft` or `Rejected` states, showing reviewer comments if rejected.
- [ ] **My Pending Reviews:** Build the queue list and the Review Detail Modal to approve/reject with mandatory feedback.

### Phase 4: Frontend Development (UI Components - Admin)
- [ ] **Question Bank Management View:** Build a paginated table for Admins to view all questions across the platform.
- [ ] **Assign Reviewer Modal:** Build the interface to select a question, filter eligible SMEs by tech stack, and assign them, transitioning the state to `Under Review`.
- [ ] **Admin Edit Rights:** Ensure Admins can bypass restrictions to edit any question in the system (except those currently in `Draft` state).

### Phase 5: Integration, Refinement & Testing
- [ ] Connect all Frontend React/Angular components to Spring Boot APIs.
- [ ] Strictly test MCQ Lifecycle state transitions to prevent invalid actions.
- [ ] End-to-end test the bulk upload feature with a sample Excel template.
- [ ] Verify Role-Based access to ensure SMEs cannot see the Admin Question Bank Management page.
- [ ] Polish UI aesthetics to align with the provided wireframes.
