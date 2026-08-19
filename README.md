# VSR_Forge

### Developer Project & Issue Management Platform

VSR Forge is a **MERN stack-based project management platform** designed for software development teams to manage projects, bugs, tasks, team members, and project progress from one place.

Instead of managing bugs and tasks through spreadsheets, messages, or multiple tools, VSR Forge provides a centralized platform where developers and project managers can collaborate and track the complete development workflow.

---

## 🎯 Problem Statement

Software teams often face difficulties managing:

* Bugs and issues
* Developer assignments
* Project deadlines
* Task progress
* Team communication
* Project performance

VSR Forge solves this by providing a single platform for managing the entire issue and project lifecycle.

---

## 💡 How VSR Forge Works

A project manager creates a project:

```text
E-Commerce Application
```

Team members are added to the project.

Developers can then create issues such as:

```text
BUG-101
Login button not working

BUG-102
Payment API returning an error

TASK-103
Create product search

FEATURE-104
Add dark mode
```

Each issue can be assigned to a developer and moved through:

```text
TODO
  ↓
IN PROGRESS
  ↓
CODE REVIEW
  ↓
TESTING
  ↓
DONE
```

The dashboard provides an overview of the project's progress.

---

## ✨ Core Features

### 🔐 Authentication

* User registration
* User login
* JWT authentication
* Secure password hashing
* Logout
* Protected routes

### 👥 User Roles

Different permissions for:

* Admin / Project Manager
* Developer
* Viewer

### 📁 Project Management

* Create projects
* Edit projects
* Delete projects
* Add team members
* Set project deadlines
* View project progress

### 🐛 Issue Management

Create and manage:

* Bugs
* Tasks
* Features
* Improvements
* Documentation issues

Each issue contains:

* Title
* Description
* Type
* Priority
* Status
* Assignee
* Creator
* Due date
* Creation date

### 📋 Kanban Board

Issues can be organized using a Kanban board:

```text
┌──────────┐
│   TODO   │
└──────────┘

┌──────────────┐
│ IN PROGRESS  │
└──────────────┘

┌──────────────┐
│ CODE REVIEW  │
└──────────────┘

┌──────────┐
│ TESTING  │
└──────────┘

┌──────────┐
│   DONE   │
└──────────┘
```

### 💬 Comments

Developers can discuss issues directly inside the platform.

### 📎 File Attachments

Upload:

* Screenshots
* Error logs
* Documents
* Other project files

### 🔍 Search & Filtering

Search issues by:

* Issue ID
* Title
* Developer

Filter by:

* Status
* Priority
* Issue type
* Assignee

### 🔔 Notifications

Users receive notifications when:

* An issue is assigned to them
* Someone comments on their issue
* Issue status changes
* They are mentioned
* A deadline is approaching

### 📊 Analytics Dashboard

Display:

* Total issues
* Open issues
* Completed issues
* Issues by priority
* Issues by type
* Developer workload
* Project completion percentage

### 📝 Activity History

Track important project actions:

```text
Vijay created BUG-101

Rahul was assigned BUG-101

Rahul changed status:
TODO → IN PROGRESS

Priya added a comment

Rahul marked BUG-101 as DONE
```

---

# 🚀 Advanced Features

These can be added after the core application is working.

### ⚡ Real-Time Updates

Use **Socket.io** so changes appear immediately without refreshing the page.

### 🤖 AI Issue Classification

Users describe an issue and the system can suggest:

```text
Type: Bug
Category: Authentication
Priority: High
```

### 🔎 Duplicate Issue Detection

When a developer creates an issue, VSR Forge can search existing issues and identify potentially similar ones.

### 🔗 GitHub Integration

Connect a project with a GitHub repository and associate:

* Issues
* Commits
* Pull requests

with VSR Forge issues.

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts

## Backend

* Node.js
* Express.js
* JWT
* bcrypt
* Socket.io

## Database

* MongoDB
* Mongoose

## Storage

* Cloudinary

## Development Tools

* Git
* GitHub
* Postman
* VS Code

## Optional

* Docker
* GitHub Actions
* AI API
* GitHub API

---

# 🏗️ System Architecture

```text
                    ┌───────────────┐
                    │    React      │
                    │   Frontend    │
                    └───────┬───────┘
                            │
                         REST API
                            │
                    ┌───────▼───────┐
                    │    Express    │
                    │    + Node.js  │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │    MongoDB    │
                    │   + Mongoose  │
                    └───────────────┘

              ┌─────────────────────────┐
              │       Socket.io         │
              │   Real-time Updates     │
              └─────────────────────────┘
```

---

# 🗄️ Main Database Collections

```text
Users
Projects
Issues
Comments
Notifications
ActivityLogs
```

### User

```text
name
email
password
role
avatar
createdAt
```

### Project

```text
name
description
owner
members
startDate
deadline
createdAt
```

### Issue

```text
issueId
title
description
type
priority
status
project
assignedTo
createdBy
dueDate
createdAt
```

---

# 🔌 Main API Endpoints

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Projects

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

## Issues

```text
POST   /api/issues
GET    /api/issues
GET    /api/issues/:id
PUT    /api/issues/:id
DELETE /api/issues/:id
```

## Comments

```text
POST /api/issues/:id/comments
GET  /api/issues/:id/comments
```

## Analytics

```text
GET /api/projects/:id/analytics
```

---

# 🔐 Security

VSR Forge will implement:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Role-based authorization
* Input validation
* Environment variables
* CORS configuration
* Secure file uploads

---

# 📅 Development Plan

The project is planned to be developed incrementally so that the basic application works before advanced features are added.

### Phase 1

Project setup and authentication

### Phase 2

Project and team management

### Phase 3

Issue management

### Phase 4

Kanban board and dashboard

### Phase 5

Comments, notifications and activity history

### Phase 6

Analytics and advanced features

### Phase 7

Testing, deployment and documentation

---

# 🎯 Project Goal

The goal of VSR Forge is to create a **production-style developer collaboration platform** rather than a basic CRUD application.

The project demonstrates practical knowledge of:

* Full-stack development
* REST API design
* Authentication
* Authorization
* Database design
* Real-time communication
* State management
* Data visualization
* Cloud storage
* Software engineering practices

---

# 👨‍💻 Developer

**Vijay Simha Reddy**

Built using the MERN stack.

---

## ⭐ Future Improvements   


* Mobile application
* Advanced GitHub integration
* AI-powered issue analysis
* Email notifications
* Sprint planning
* Time tracking
* Automated reports
* Advanced team analytics
* Docker-based deployment
* CI/CD pipeline
