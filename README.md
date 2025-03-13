# Donezo

A full-stack application for managing tasks and projects collaboratively.

## Demo Video

https://github.com/user-attachments/assets/ff7e3b98-ba6f-4e18-8612-38dba05db73e



## Project Structure

```
.
├── backend/           # Node.js backend service
├── frontend/         # React frontend application
└── README.md         # Project documentation
```

## Features

- User Management (Admin, Manager, Member roles)
- Project & Task Management
- Real-time Collaboration
- Task Assignment & Tracking
- File Attachments
- Comments on Tasks
- Notification System
- Project Reports

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:

   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

## API Documentation

The API documentation will be available at `http://localhost:5000/api-docs` when the backend server is running.
