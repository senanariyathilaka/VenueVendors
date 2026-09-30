# Full Stack Development - Assignment 2

## Group Details

**Course:** Full Stack Development / Further Web Programming
**Practical Class:** PRA01 - Activity 02
**Teacher/Tutor:** Alex
**Day/Time:** Wednesday, 6:30 PM
**Location:** 014.09.024

## Group Members

**Student 1:** Khalid Dayib - s3947672
**Student 2:** Senan Ariyathilaka - s4006589

## GitHub Repository

https://github.com/rmit-fsd-2026-s1/a2-fsd-pra01-02-wed-6-30pm-alex-team-17.git

## Render Deployment Links

### Main User System

**Main Frontend:**
https://venue-guys-main-frontend.onrender.com

**Main Backend:**
https://venue-guys-main-backend.onrender.com

**Main Backend API Example:**
https://venue-guys-main-backend.onrender.com/api/venues

### Admin System

**Admin Frontend:**
https://venue-guys-admin-frontend.onrender.com

**Admin Backend:**
https://venue-guys-admin-backend.onrender.com

**Admin GraphQL Sandbox:**
https://venue-guys-admin-backend.onrender.com/graphql

## Important Render Note

Render free services may go to sleep after inactivity. If the frontend loads slowly or data does not appear straight away, open the backend links first to wake the services, then refresh the frontend.

Useful wake-up links:

* https://venue-guys-main-backend.onrender.com/api/venues
* https://venue-guys-admin-backend.onrender.com/graphql

## Environment Files Included for Marking

The required environment files have been included in the private GitHub Classroom repository for marker testing.

The environment files are located here:

```text
A2/node-express-typeorm-a2/.env
A2/admin-backend/.env
A2/a2/.env.local
A2/admin-frontend/.env.local
```

These files include the required database connection details and deployed API endpoint URLs needed to run and test the project locally.

The deployed Render services also have the same required environment variables configured in the Render dashboard.


## Demo Login Accounts

### Hirer Accounts

**Mia Carter**
Email: `mia.hirer@venuevendors.com`
Password: `Hirer@123`

**Noah Singh**
Email: `noah.hirer@venuevendors.com`
Password: `Secure@456`

### Vendor Accounts

**Luca Bennett**
Email: `luca.vendor@venuevendors.com`
Password: `Vendor@123`

**Chloe Adams**
Email: `chloe.vendor@venuevendors.com`
Password: `Venue@456`

**Ethan Ali**
Email: `ethan.vendor@venuevendors.com`
Password: `Booking@789`

### Admin Account

Admin login is used for the separate admin frontend.

**Admin Frontend:**
https://venue-guys-admin-frontend.onrender.com

**Username:** `admin`
**Password:** `admin`

For protected GraphQL queries in the admin backend sandbox, use this header:

```json
{
  "Authorization": "Bearer admin-static-token"
}
```

## Folder Structure

The project contains four main services:

```text
A2/
├── a2/
│   └── Main Next.js frontend for hirers and vendors
│
├── node-express-typeorm-a2/
│   └── Main Node/Express/TypeORM REST backend
│
├── admin-frontend/
│   └── Separate admin Next.js frontend
│
└── admin-backend/
    └── Separate admin GraphQL backend
```

### Important Vendor Page Note

All vendor Credit and Distinction functions are accessed through buttons inside the main vendor page.

On the vendor page, markers should use:

* **Venue Editor** button for vendor venue management / CRUD-related vendor functions
* **Vendor Analytics** button for Distinction analytics charts
* Application cards and booking controls inside the vendor page for booking/application management
* Blocked date controls for venue unavailability/blocked periods


## Environment Variables

Environment variables are required for the backend database connection and frontend API URLs.

### Main Backend `.env`

Folder:

```text
A2/node-express-typeorm-a2/.env
```

Required variables:

```env
DB_HOST=
DB_PORT=1433
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
PORT=3001
```

### Admin Backend `.env`

Folder:

```text
A2/admin-backend/.env
```

Required variables:

```env
DB_HOST=
DB_PORT=1433
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
PORT=4000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ADMIN_TOKEN=admin-static-token
```


### Main Frontend `.env.local`

Folder:

```text
A2/a2/.env.local
```

Required variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://venue-guys-main-backend.onrender.com/api
```

### Admin Frontend `.env.local`

Folder:

```text
A2/admin-frontend/.env.local
```

Required variable:

```env
NEXT_PUBLIC_ADMIN_GRAPHQL_URL=https://venue-guys-admin-backend.onrender.com/graphql
```

## Local Installation and Running Instructions

Each service needs its own install step because the project is split into four folders.

### 1. Main Backend

```bash
cd A2/node-express-typeorm-a2
npm install
npm run build
npm run dev
```

Local URL:

```text
http://localhost:3001
```

Example local API:

```text
http://localhost:3001/api/venues
```

### 2. Main Frontend

```bash
cd A2/a2
npm install
npm run build
npm run dev
```

Local URL:

```text
http://localhost:3000
```

### 3. Admin Backend

```bash
cd A2/admin-backend
npm install
npm run build
npm run dev
```

Local GraphQL sandbox:

```text
http://localhost:4000/graphql
```

### 4. Admin Frontend

```bash
cd A2/admin-frontend
npm install
npm run build
npm run dev
```

Local URL:

```text
http://localhost:3002
```

## Testing Instructions

### Admin Backend Tests

The admin backend includes contextual unit tests for admin GraphQL functionality.

Run:

```bash
cd A2/admin-backend
npm test
```

The tests cover:

* Admin login success and failure
* Rejection of missing/invalid admin tokens
* Admin venue creation
* Admin venue update
* Admin featured venue and vendor reassignment
* Admin delete protection for venues with applications

Expected result:

```text
Test Suites: 1 passed
Tests: 6 passed
```

## Packages Used

The project uses Node.js, Express, TypeORM, Microsoft SQL Server, React, Next.js, GraphQL, and testing/reporting packages.

Important packages used include:

```text
express
cors
typeorm
mssql
reflect-metadata
dotenv
graphql
graphql-http
ruru
next
react
react-dom
recharts
jspdf
jspdf-autotable
jest
ts-jest
@types/jest
typescript
```

## Notes for Markers

* The normal backend root URL may show `Cannot GET /`. Please test the backend using API endpoints such as `/api/venues`.
* The admin backend has a visible GraphQL sandbox at `/graphql`.
* Protected admin GraphQL queries require the header `Authorization: Bearer admin-static-token`.
* Vendor Credit and Distinction functions are accessed from buttons inside the vendor page.
* The admin dashboard includes both webpage reports and a downloadable PDF report.
* Render services may sleep, so the first load may take some time.
* If the frontend appears to load without data, open the backend URL first to wake the service, then refresh the frontend.
* Database credentials and API endpoint variables are provided through `.env` / Render environment variables.
* Some browser warnings from charts may appear during initial rendering, but the analytics page is functional after the page has loaded.

## REFERENCES 
Websites we have used:

  Recharts (React Graphs & Infographics)
* https://recharts.org/en-US

  Examples:
* https://recharts.org/en-US/examples

  Bar Chart:
* https://recharts.org/en-US/examples/SimpleBarChart

  Stacked Bar Chart:
* https://recharts.org/en-US/examples/StackedBarChart

  Pie Chart:
* https://recharts.org/en-US/examples/SimplePieChart

  Line Chart:
* https://recharts.org/en-US/examples/SimpleLineChart

  Dashboard Tutorial:
* https://blog.logrocket.com/create-charts-react-recharts/

  Data Visualisation:
* https://datavizcatalogue.com/

  Dashboard Design
* https://www.tableau.com/learn/articles/dashboard-design-principles

  Render - Your First Render Deploy
* https://render.com/docs/your-first-deploy

 Used for understanding Render deployment flow and service setup.
  Render - Deploy a Node Express App
* https://render.com/docs/deploy-node-express-app

 Used for deploying the Express/Node backend services as Render Web Services.
  Render - Environment Variables and Secrets
* https://render.com/docs/configure-environment-variables

 Used for configuring database credentials and API URLs on Render.
  Next.js - Self Hosting
* https://nextjs.org/docs/pages/guides/self-hosting

 Used for deploying the Next.js frontends with next start and understanding production hosting.
  Next.js - Environment Variables
* https://nextjs.org/docs/app/guides/environment-variables

 Used for understanding .env.local and NEXTPUBLIC frontend environment variables.
  Express CORS Middleware
* https://expressjs.com/en/resources/middleware/cors/

 Used for allowing the deployed frontends to communicate with the deployed backend APIs.
  TypeORM - Microsoft SQL Server Driver
* https://typeorm.io/docs/drivers/microsoft-sqlserver/

 Used for configuring TypeORM with the Microsoft SQL Server database.
 GraphQL HTTP / Ruru GraphiQL Documentation
* https://github.com/graphql/graphql-http

 Used for the admin GraphQL endpoint and visible GraphQL sandbox.
 Recharts Documentation
* https://recharts.org/

 Used for the vendor analytics charts, including bar, stacked, pie, and line charts.
jsPDF Documentation
* https://www.npmjs.com/package/jspdf

 Used for generating the downloadable admin PDF report.
 Jest Getting Started Documentation

* https://jestjs.io/docs/getting-started
 Used for setting up and running backend unit tests.

Youtube videos 

  Recharts Dashboard:
* https://www.youtube.com/watch?v=lyeK0D6F2zI

  Full Stack React + Express:
* https://www.youtube.com/watch?v=w3vs4a03y3I

  TypeORM + Express:
* https://www.youtube.com/watch?v=I6ypD7qv3Z8


Lecture Slides:

 * Slides Week 12 GraphQL

 * Slides Week 8 Full Stack Development  
 
 * Slides Week 9 
