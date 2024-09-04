# Natours APIs

This project is a RESTful API for the Natours application, a tour booking platform. It provides endpoints for managing users, tours, bookings, and reviews. The API is built using Node.js, Express, and MongoDB, and follows best practices for authentication, authorization, and error handling.

## Features

- **User Authentication**: JWT-based authentication for secure user login and registration.
- **Tour Management**: Create, update, delete, and view tours.
- **Booking System**: Handle tour bookings, including payment processing.
- **Review System**: Users can leave reviews for tours they have booked.
- **Data Validation & Security**: Implemented with Helmet, CORS, and data sanitization.
- **Advanced Querying**: Filtering, sorting, and pagination of results.
- **Error Handling**: Centralized error handling with detailed messages and status codes.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abdelrhmanshata/Natours-APIs.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a .env file in the root directory.
   Add the required environment variables (refer to .env.example).

4. Start the server:
   ```bash
   npm start
   ```
## Endpoints

Here’s a brief overview of the main API endpoints:

- **/api/v1/tours**: Manage tours (GET, POST, PATCH, DELETE).
- **/api/v1/users**: Manage users and authentication (GET, POST, PATCH, DELETE).
- **/api/v1/bookings**: Manage bookings (GET, POST, PATCH, DELETE).
- **/api/v1/reviews**: Manage reviews (GET, POST, PATCH, DELETE).
  
For a full list of endpoints and their details, refer to the Postman Collection.


   
