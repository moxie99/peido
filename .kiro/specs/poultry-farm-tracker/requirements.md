# Requirements Document

## Introduction

A web-based poultry farm management tool for a chicken farm owner to track feed purchases (inputs), monitor feed consumption lifecycle, record egg production output per feed batch, and determine profitability. The system correlates feed costs against egg yield revenue to give the farmer a clear picture of whether the business is profitable, breaking even, or running at a loss.

The initial scope is limited to feed tracking and egg output correlation. The tech stack is Next.js (fullstack) hosted on Vercel with a PostgreSQL database.

## Glossary

- **System**: The Poultry Farm Tracker web application
- **Farmer**: The authenticated user who owns and operates the chicken farm
- **Feed_Batch**: A single purchase/delivery of chicken feed, identified by date, quantity, cost, and feed type
- **Feed_Log**: The record of a Feed_Batch entering the farm inventory
- **Depletion_Event**: A recorded event marking when a Feed_Batch has been fully consumed
- **Egg_Record**: A daily log entry of the number of eggs collected from the flock
- **Profitability_Report**: A computed summary comparing total feed cost against total egg revenue for a given period or Feed_Batch
- **Dashboard**: The main overview screen showing current inventory status, recent egg production, and profitability summary
- **Egg_Price**: The configured selling price per egg or per tray used for revenue calculations

---

## Requirements

### Requirement 1: Feed Batch Logging

**User Story:** As a Farmer, I want to log each feed purchase as a Feed_Batch, so that I can track exactly how much I spent on feed and when it arrived.

#### Acceptance Criteria

1. WHEN the Farmer submits a new feed entry, THE System SHALL create a Feed_Log record containing feed type, quantity in kilograms, total purchase cost, supplier name, and purchase date.
2. THE System SHALL assign a unique identifier to each Feed_Batch upon creation.
3. WHEN the Farmer omits a required field (feed type, quantity, cost, or purchase date), THE System SHALL reject the submission and return a descriptive validation error identifying the missing field.
4. THE System SHALL store the cost per kilogram, derived by dividing total purchase cost by quantity, for each Feed_Batch.
5. WHEN a Feed_Batch is created, THE System SHALL set its status to "active".

---

### Requirement 2: Feed Inventory Status

**User Story:** As a Farmer, I want to see the current feed inventory status, so that I know how much feed is available and which batch is currently in use.

#### Acceptance Criteria

1. THE System SHALL display all Feed_Batches with status "active" on the Dashboard.
2. WHEN multiple Feed_Batches are active, THE System SHALL list them ordered by purchase date ascending (oldest first).
3. THE System SHALL display the quantity, cost, feed type, and purchase date for each active Feed_Batch.
4. WHEN no active Feed_Batches exist, THE System SHALL display a prompt indicating that no feed is currently in stock.

---

### Requirement 3: Feed Depletion Recording

**User Story:** As a Farmer, I want to mark when a feed batch is finished, so that I can close the batch and associate the egg output with that specific feed period.

#### Acceptance Criteria

1. WHEN the Farmer marks a Feed_Batch as finished, THE System SHALL create a Depletion_Event recording the Feed_Batch identifier and the depletion date.
2. WHEN a Depletion_Event is recorded, THE System SHALL update the Feed_Batch status from "active" to "depleted".
3. WHEN the Farmer attempts to mark a Feed_Batch that is already "depleted" as finished, THE System SHALL reject the action and return an error message.
4. THE System SHALL record the depletion date as the date provided by the Farmer, defaulting to the current date if none is provided.

---

### Requirement 4: Daily Egg Production Recording

**User Story:** As a Farmer, I want to log the number of eggs collected each day, so that I can track production output over time.

#### Acceptance Criteria

1. WHEN the Farmer submits a daily egg count, THE System SHALL create an Egg_Record containing the collection date and the number of eggs collected.
2. WHEN the Farmer submits an egg count for a date that already has an Egg_Record, THE System SHALL update the existing record rather than creating a duplicate.
3. WHEN the Farmer submits an egg count less than zero, THE System SHALL reject the submission and return a validation error.
4. THE System SHALL associate each Egg_Record with the active Feed_Batch on the collection date, if one exists.
5. WHEN no active Feed_Batch exists on the collection date, THE System SHALL still save the Egg_Record without a Feed_Batch association.

---

### Requirement 5: Feed Batch to Egg Output Correlation

**User Story:** As a Farmer, I want to see how many eggs were produced during each feed batch period, so that I can evaluate the productivity of each batch.

#### Acceptance Criteria

1. THE System SHALL compute the total eggs collected between the purchase date and depletion date of a Feed_Batch.
2. WHEN a Feed_Batch is still active, THE System SHALL compute the running total of eggs collected since the purchase date up to the current date.
3. THE System SHALL display the total egg count alongside the Feed_Batch cost on the Feed_Batch detail view.
4. THE System SHALL compute the egg yield rate as total eggs divided by feed quantity in kilograms for each Feed_Batch.

---

### Requirement 6: Profitability Calculation

**User Story:** As a Farmer, I want to see whether each feed batch and overall periods are profitable, so that I can make informed decisions about my farm operations.

#### Acceptance Criteria

1. THE System SHALL compute revenue for a Feed_Batch as total eggs collected during that batch multiplied by the configured Egg_Price.
2. THE System SHALL compute profit for a Feed_Batch as revenue minus the Feed_Batch total purchase cost.
3. WHEN profit is greater than zero, THE System SHALL classify the Feed_Batch as "profitable".
4. WHEN profit equals zero, THE System SHALL classify the Feed_Batch as "break-even".
5. WHEN profit is less than zero, THE System SHALL classify the Feed_Batch as "loss".
6. THE System SHALL compute an overall Profitability_Report for a Farmer-selected date range, summing all feed costs and all egg revenue within that range.
7. WHEN the Farmer has not configured an Egg_Price, THE System SHALL prompt the Farmer to set an Egg_Price before displaying profitability calculations.

---

### Requirement 7: Egg Price Configuration

**User Story:** As a Farmer, I want to configure the selling price per egg, so that the system can calculate revenue accurately.

#### Acceptance Criteria

1. THE System SHALL allow the Farmer to set and update the Egg_Price (price per individual egg) in the farm settings.
2. WHEN the Farmer updates the Egg_Price, THE System SHALL apply the new price to all future profitability calculations.
3. WHEN the Farmer updates the Egg_Price, THE System SHALL retain the previous Egg_Price value with a timestamp so historical calculations remain auditable.
4. WHEN the Farmer enters a non-positive value for Egg_Price, THE System SHALL reject the input and return a validation error.

---

### Requirement 8: Dashboard Overview

**User Story:** As a Farmer, I want a single-screen overview of my farm's current status, so that I can quickly assess the situation without navigating multiple pages.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current active Feed_Batch count, total feed cost to date for the current month, total eggs collected for the current month, and current month profitability status.
2. WHEN the Farmer loads the Dashboard, THE System SHALL render the overview data within 2 seconds under normal network conditions.
3. THE Dashboard SHALL display a summary of the last 7 days of egg production as a data table or chart.
4. WHEN no data exists for the current month, THE Dashboard SHALL display zero values rather than empty or error states.

---

### Requirement 9: Historical Reporting

**User Story:** As a Farmer, I want to view historical feed and egg data filtered by date range, so that I can analyze trends over time.

#### Acceptance Criteria

1. WHEN the Farmer selects a date range, THE System SHALL return all Feed_Batches purchased within that range and all Egg_Records collected within that range.
2. THE System SHALL display the aggregated feed cost, total eggs, total revenue, and net profit for the selected date range.
3. WHEN the selected date range contains no data, THE System SHALL display a message indicating no records exist for that period.
4. THE System SHALL allow the Farmer to filter Feed_Batches by feed type.

---

### Requirement 10: Authentication and Access Control

**User Story:** As a Farmer, I want my farm data to be private and accessible only to me, so that my business information is secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any data page, THE System SHALL redirect the user to the login page.
2. THE System SHALL authenticate the Farmer using an email address and password.
3. WHEN the Farmer provides incorrect credentials, THE System SHALL return a generic authentication failure message without revealing which field is incorrect.
4. THE System SHALL store passwords using a cryptographic hashing algorithm with a per-user salt.
5. WHEN the Farmer's session expires, THE System SHALL redirect the Farmer to the login page and preserve the originally requested URL for post-login redirect.
6. THE System SHALL enforce that each Farmer can only read and write data belonging to their own farm account.

---

### Requirement 11: Data Persistence and Integrity

**User Story:** As a Farmer, I want my data to be reliably stored and consistent, so that I never lose records due to system errors.

#### Acceptance Criteria

1. THE System SHALL persist all Feed_Logs, Egg_Records, and Depletion_Events to a PostgreSQL database.
2. WHEN a database write operation fails, THE System SHALL return an error response to the client and SHALL NOT partially commit related records.
3. THE System SHALL enforce referential integrity between Egg_Records and Feed_Batches at the database level.
4. THE System SHALL index the Feed_Batch purchase date and Egg_Record collection date columns to support efficient date-range queries.
