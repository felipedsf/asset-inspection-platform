# Business Requirement: Operational Dashboard (Painel Operacional)

## Objective
This document outlines a high-level request from the client. No code, UI designs, or API endpoints exist for this feature. As part of Module 4, the student must act as a Product Manager, Architect, and Developer, using AI (ChatGPT, Claude, Cursor) to gather requirements, design the layout, plan the backend metrics queries, and develop the dashboard.

---

## The Briefing

> **Client Request:**
> *"We need an operational dashboard for our maintenance managers. Currently, they have to click through individual assets and inspections to understand what's going on in the field. We want a single page that gives a visual overview of our industrial plants, key performance indicators, active/critical alerts, and helps managers decide where to deploy our drone teams and technicians."*

---

## Steps for the Student (Prompt Engineering & Architecture)

### Step 1: Refining Requirements (Ask the right questions to the AI)
The client brief is vague. The student must formulate prompts to refine the product requirements.
*Example questions to resolve with the AI:*
- What key performance indicators (KPIs) are most relevant for industrial asset maintenance? (e.g. Mean Time to Inspect, percentage of failed inspections, active alerts count).
- Should the dashboard support date filtering?
- Does the client want interactive charts (bar charts, line charts, pie charts)? If so, what libraries should be used (e.g., Chart.js, Recharts, or simple custom CSS bar graphs)?
- Should there be a map interface (mocked drone inspection locations)?

### Step 2: Creating the Backlog & User Stories
Create a backlog of tasks to implement the dashboard.
*Example stories:*
- "As a manager, I want to see the count of assets currently marked as 'maintenance' or 'inactive' so I can plan repairs."
- "As a manager, I want a breakdown of inspection statuses (draft, pending, approved) to track review backlogs."
- "As a manager, I want a list of the 5 most recently created inspections to quickly access new findings."
- "As a manager, I want visual charts demonstrating inspection status trends over time."

### Step 3: Architecture & API Design
Plan how the backend will deliver this data efficiently.
- Will you expand the existing `/api/reports/summary` endpoint? Or create a dedicated dashboard route `/api/dashboard/metrics`?
- What raw SQLite queries are required to calculate these metrics? Ensure no SQL injections or N+1 queries are introduced.
- How can you optimize page load performance?

### Step 4: UI/UX Design & Implementation
- Design a beautiful layout that fits the theme of the application (futuristic dark theme, glassmorphic layout).
- Use metric cards with high-contrast numbers and micro-animations.
- Include a grid of KPI summary blocks, interactive charts, and recent activity streams.
