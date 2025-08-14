# Project: Travel Blog

## Project Overview

This is a travel blog application built with Node.js and Express. It allows users to create, view, edit, and delete travel logs and their associated itineraries. The application uses a SQLite database to store data, with Sequelize as the ORM. The front-end is rendered using EJS templates. User authentication is implemented with session-based authentication, and there is a distinction between admin and regular users.

**Key Technologies:**

*   **Backend:** Node.js, Express.js
*   **Database:** SQLite, Sequelize
*   **Templating:** EJS
*   **Authentication:** express-session, bcryptjs
*   **File Uploads:** multer

**Architecture:**

The project follows a standard Model-View-Controller (MVC) pattern:

*   **`models/`**: Contains the Sequelize model definitions for `User`, `Travel`, and `Itinerary`.
*   **`views/`**: Contains the EJS templates for rendering the application's UI.
*   **`controllers/`**: (Implicitly handled within the routes) The route handlers in `routes/` act as controllers, processing requests and interacting with the models.
*   **`routes/`**: Defines the application's routes for handling travel logs, itineraries, and authentication.
*   **`public/`**: Contains static assets like CSS, JavaScript, and images.
*   **`app.js`**: The main entry point of the application.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Run the Application:**

For development with automatic reloading:

```bash
npm run dev
```

For production:

```bash
npm start
```

The application will be available at `http://localhost:5001`.

## Development Conventions

*   **Database:** The application uses a SQLite database, and the database file is `travel_blog_node.db`. The database schema is automatically synchronized based on the models defined in `models/index.js`.
*   **Authentication:** The application uses session-based authentication. The `isAuthenticated` and `isAdmin` middleware in `middleware/auth.js` are used to protect routes.
*   **Routing:** Routes are organized into separate files in the `routes/` directory.
*   **Views:** EJS is used for templating. The main layout is in `views/layout.ejs`.
*   **Static Assets:** Static assets are served from the `public/` directory.
*   **File Uploads:** File uploads are handled by `multer` and stored in the `uploads/` directory.
