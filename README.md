# Refund Management System

A Next.js application for managing refund requests through various approval stages. Built with Prisma, Tailwind CSS, and deployed on Vercel.

## Application Overview: Purpose, Principles, and Workflow

This system is designed to bring clarity, efficiency, and accountability to the complex process of managing refunds. It serves as a centralized platform for all stakeholders involved in a refund lifecycle, from initial request to final resolution.

### Purpose & Reason for Existence

In many organizations, refund processing can be a fragmented, time-consuming, and error-prone endeavor, leading to customer dissatisfaction and internal inefficiencies. The Refund Management System exists to:

*   **Streamline Operations:** Provide a structured and automated workflow for handling refund requests.
*   **Enhance Transparency:** Offer clear visibility into the status and history of each refund for all involved parties.
*   **Improve Accountability:** Ensure that every action and decision is logged and attributable to a specific user and role.
*   **Reduce Processing Time:** Minimize delays by standardizing procedures and facilitating smoother handoffs between roles.
*   **Increase Accuracy:** Reduce manual errors through guided processes and data validation.
*   **Boost Customer & User Satisfaction:** Provide a more responsive and understandable refund experience for clients and a more organized tool for internal teams.

### Founding Principles

The development and operation of this system are guided by the following core principles:

1.  **Efficiency:** The system must simplify and accelerate the refund process, eliminating unnecessary steps and manual effort.
2.  **Transparency:** All actions, comments, and status changes related to a refund request should be clearly visible to authorized users, fostering trust and understanding.
3.  **Accountability:** Every significant step in the refund lifecycle must be traceable to a specific user and role, ensuring responsibility.
4.  **Fairness & Consistency:** The system should support consistent application of refund policies and ensure fair treatment for all clients.
5.  **User-Centricity:** The interface and workflows should be intuitive and cater to the needs of its diverse users, from clients to finance personnel.
6.  **Security & Compliance:** Data integrity and secure access are paramount, ensuring that sensitive information is protected and processes adhere to relevant regulations.
7.  **Continuous Improvement:** The system is designed to be adaptable, allowing for iterative enhancements based on feedback and evolving business needs.

### User Roles & Hierarchy

The system defines distinct user roles, each with specific responsibilities and access levels, operating within a clear hierarchy to ensure proper checks and balances:

1.  **Client:**
    *   **Responsibilities:** Initiates refund requests (or has them initiated on their behalf), provides necessary documentation and information, tracks the status of their request.
    *   **Interaction:** Primarily at the beginning and end of the process, or when additional information is required.

2.  **Agent:**
    *   **Responsibilities:** First point of contact for refund requests. Validates request details, gathers necessary information from the client, performs initial assessment and fraud checks, makes first-level decisions (approve, reject, escalate, or return for more information), and maintains communication with the client.
    *   **Hierarchy:** Reports to/escalates to Team Lead.

3.  **Team Lead:**
    *   **Responsibilities:** Reviews refund requests processed or escalated by Agents. Provides second-level approval or rejection, handles more complex cases, ensures policy adherence within the team, and may have higher approval limits than Agents.
    *   **Hierarchy:** Reports to/escalates to Supervisor; manages a team of Agents.

4.  **Supervisor:**
    *   **Responsibilities:** Manages overall refund operations for a department or region. Handles high-value or highly sensitive refund requests escalated by Team Leads. Provides final approval for significant refunds, resolves disputes, and oversees policy implementation and exceptions.
    *   **Hierarchy:** Manages Team Leads; may report to higher management or Finance.

5.  **Finance:**
    *   **Responsibilities:** Processes the actual payment for approved refunds. Conducts final financial checks and reconciliations. Ensures compliance with financial regulations and internal accounting practices.
    *   **Hierarchy:** Typically a separate department that acts upon fully approved refund requests.

The flow generally follows this hierarchical progression, though specific escalations or bypasses might be configured based on refund amount, risk, or type.

### Core Refund Workflow (User Flow)

The typical lifecycle of a refund request within the system is as follows:

1.  **Request Initiation:**
    *   A client submits a refund request, or an Agent initiates one on behalf of a client.
    *   Essential details (order ID, amount, reason, client information, and crucially, the corresponding Zendesk Ticket ID) are captured.
    *   The request enters the system with an initial status (e.g., "DRAFT" or "PENDING_AGENT_REVIEW").

2.  **Agent Review & Processing:**
    *   An Agent picks up the request, referencing the Zendesk Ticket ID to access the prior conversation and context.
    *   They verify the information, check against order history and refund policies, and may communicate with the client for clarification or additional documents via Zendesk or directly.
    *   The Agent can: Approve (if within their limit), Reject (with justification), Escalate to Team Lead, or Return to Client for more information.
    *   All actions and comments are logged.

3.  **Team Lead Review & Approval (if applicable):**
    *   If escalated or requiring second-level approval, a Team Lead reviews the Agent's findings and the request details.
    *   The Team Lead can: Approve, Reject, Escalate to Supervisor, or Return to Agent/Client.

4.  **Supervisor Review & Final Approval (if applicable):**
    *   For high-value, complex, or contentious cases, a Supervisor provides further review and final internal approval.
    *   The Supervisor can: Approve, Reject, or Return to Lead/Agent.

5.  **Finance Processing:**
    *   Once a refund request is fully approved (e.g., status "APPROVED_FOR_PAYMENT"), it moves to the Finance queue.
    *   The Finance team performs final checks and processes the payment through the designated payment method.
    *   The status is updated to "PAYMENT_PROCESSING" and then "PAID".

6.  **Communication & Closure:**
    *   The client is kept informed of significant status changes throughout the process.
    *   Once paid or definitively rejected/cancelled, the request is closed.
    *   All interactions and decisions are recorded in an immutable audit log.

### Key System Behaviors & Rules

*   **Status-Driven Workflow:** The state of a refund request (its `RefundStatus`) dictates available actions and user responsibilities.
*   **Audit Trail:** Every significant action, status change, and comment is logged with a timestamp and user attribution, ensuring a complete history for each request.
*   **Role-Based Access Control (RBAC):** Users can only perform actions and view data permitted by their assigned role.
*   **Comments & Notes:** Each role can add internal or external comments to facilitate communication and record decision rationale.
*   **Duplicate Detection:** The system may include checks to prevent duplicate refund requests for the same order/issue.
*   **Flagging & Escalation Paths:** Mechanisms for flagging suspicious requests or automatically escalating requests based on predefined criteria (e.g., amount, risk score).

### Meaning & Desired Impact

The Refund Management System aims to transform refund handling from a potential pain point into a well-managed, transparent, and efficient operational process. The desired impact is not only cost savings and risk reduction but also an improvement in trust – both from customers who experience a fair and responsive system, and from internal users who are empowered with a tool that simplifies their work and supports sound decision-making.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Database](#database)
  - [Schema](#schema)
  - [Seeding](#seeding)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, yarn, or pnpm
- A database server (PostgreSQL recommended for production/Vercel deployment if write operations are needed)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd refund-management-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

Create a `.env` file in the root of your project and add the necessary environment variables. At a minimum, you will need:

```env
DATABASE_URL="your_database_connection_string"

# Example for local SQLite development (Note: Vercel deployment with SQLite will be mostly read-only for database interactions at runtime):
# DATABASE_URL="file:./prisma/dev.db"

# Example for PostgreSQL (Recommended for full functionality on Vercel):
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Ensure your `DATABASE_URL` points to your database. For local development, SQLite can be used. However, for Vercel deployment requiring database write capabilities (e.g., approving refunds, updating statuses), a hosted PostgreSQL (or similar serverless-friendly) database is **essential** to avoid "readonly database" errors.

## Available Scripts

In the project directory, you can run:

-   `npm run dev` or `yarn dev` or `pnpm dev`
    Runs the app in development mode with Turbopack. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

-   `npm run build` or `yarn build` or `pnpm build`
    Builds the app for production to the `.next` folder. It also runs `prisma generate`, `prisma db push` (or your migration command), and the seed script against the `DATABASE_URL` configured for the build environment.

-   `npm run start` or `yarn start` or `pnpm start`
    Starts the production server. Requires a build to be run first.

-   `npm run lint` or `yarn lint` or `pnpm lint`
    Lints the project files using Next.js's built-in ESLint configuration.

-   `npm run postinstall` or `yarn postinstall` or `pnpm postinstall`
    Automatically runs `prisma generate` after installing dependencies.

**Prisma specific scripts:**
(You might run these with `npx prisma <command>`)
-   `prisma generate`: Generates Prisma Client based on your schema.
-   `prisma db push`: Pushes the state of your Prisma schema to the database without using migrations (good for prototyping with SQLite or initial setup; consider `prisma migrate dev` and `prisma migrate deploy` for robust development with PostgreSQL).
-   `prisma studio`: Opens Prisma Studio, a GUI for your database.
-   `node prisma/seed.js`: Runs the database seed script.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (v15+)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** Radix UI (via shadcn/ui components like Checkbox, Label, Slot); Sonner (for toast notifications)
-   **Icons:** Lucide React
-   **Deployment:** [Vercel](https://vercel.com/)

## Database

The application uses Prisma to interact with the database.

### Schema

The Prisma schema is defined in `prisma/schema.prisma`. It includes models for `RefundRequest`, `User`, and `AuditLog`.

### Seeding

Seed data is defined in `prisma/seed.js`. It can be run using `node prisma/seed.js` or as part of the `npm run build` process. This script populates the database with initial users and refund requests.

## Deployment

This application is configured for deployment on [Vercel](https://vercel.com/).

**Important Considerations for Vercel Deployment:**

1.  **Database Choice is Critical for Functionality:**
    *   Using **SQLite on Vercel will result in a mostly read-only application at runtime.** Any action that attempts to write to the database (e.g., creating new refunds, approving/rejecting, adding comments) will likely fail with a "readonly database" error. This is due to the nature of serverless function filesystems.
    *   For full read/write functionality on Vercel, **a hosted, serverless-friendly database (e.g., Vercel Postgres, Neon, Supabase) is mandatory.**
    *   Configure the `DATABASE_URL` environment variable in your Vercel project settings (for both build and runtime) to point to your chosen hosted database service.

2.  **Prisma `binaryTargets`:**
    *   Ensure your `prisma/schema.prisma` includes the necessary binary targets for Vercel's environment, e.g.:
        ```prisma
        generator client {
          provider      = "prisma-client-js"
          binaryTargets = ["native", "rhel-openssl-3.0.x"] // Add other targets if needed, like "debian-openssl-3.0.x"
        }
        ```

3.  **Build Process:**
    *   The `package.json` build script (`prisma generate && prisma db push --skip-generate && node prisma/seed.js && next build`) handles Prisma client generation, schema pushing, and seeding. 
    *   If using a PostgreSQL database with migrations, replace `prisma db push --skip-generate` with `prisma migrate deploy` in your build script.

4.  **SQLite Runtime Copy Logic (If attempting SQLite, with known limitations):**
    *   The `lib/prisma.js` file contains logic to copy a bundled SQLite database to `/tmp` at runtime. While this enables reads, writes remain problematic.
    *   If you switch to a hosted database, this copy logic should be removed from `lib/prisma.js`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes. (Further details can be added here).

## License

This project is licensed under the MIT License. (Or choose another license as appropriate). 