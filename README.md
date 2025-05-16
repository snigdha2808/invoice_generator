# invoice_generator

# Invoice Generator Application

This is a full-stack web application that allows users to create, manage, and send invoices. It features user authentication, PDF generation, email integration, and online payment processing via Razorpay.

## Project Structure

The project is divided into two main parts:

-   `client/`: Contains the frontend React application.
-   `server/`: Contains the backend Node.js/Express API.

## Client-Side (`client/src`)

The client-side is built with React and Vite.

-   **`main.jsx`**: The entry point of the React application. It renders the main `App` component and sets up the `BrowserRouter`.
-   **`App.jsx`**: The root component that defines the application layout and routing structure. It likely includes:
    -   Integration with `AuthContext` to manage user authentication state.
    -   Public and private routes to control access to different parts of the application based on authentication status.
-   **`index.css` / `App.css`**: Global stylesheets for the application.
-   **`assets/`**: Contains static assets like images or icons.

### `pages/`

This directory contains the main page components:

-   **`LandingPage.jsx`**: The initial page users see. It might display information about the application and provide options to log in or register. It currently uses a hardcoded list of 5 templates for invoice creation.
-   **`CreateInvoicePage.jsx`**: A form for users to create new invoices. It auto-fills the user's company details (name, address, email, phone) from their profile. It sources invoice templates from a local list defined in `LandingPage.jsx`.
-   **`ViewInvoicesPage.jsx`**: Displays a list of invoices created by the logged-in user. Users can typically view, download PDF, or delete invoices from here.
-   **`PayInvoicePage.jsx`**: Allows clients to pay for an invoice using Razorpay. It fetches invoice details and initiates the Razorpay payment flow. It uses the `VITE_RAZORPAY_KEY_ID` environment variable.
-   **`LoginPage.jsx` & `RegisterPage.jsx`**: Components for user authentication (login and registration).
-   **`DashboardPage.jsx` (or similar)**: The main page users see after logging in, possibly showing an overview or quick links.

### `components/`

This directory contains reusable UI components:

-   **`InvoiceList.jsx`**: A component responsible for rendering a list of invoices, typically in a table format.
    -   Uses CSS Modules (`InvoiceList.module.css`) for styling to provide a more attractive and maintainable UI.
    -   Includes functionality for downloading invoice PDFs and deleting invoices, with API calls proxied via `/api`.
-   **`Navbar.jsx` (or similar)**: The navigation bar component, showing different links based on authentication status.
-   **`PrivateRoute.jsx` (or similar)**: A higher-order component or utility to protect routes that require authentication.

### `context/`

This directory manages global state:

-   **`AuthContext.jsx`**: Provides authentication state (e.g., current user, token) and functions (login, logout, register) to the rest of the application using React Context API.

## Server-Side (`server/`)

The server-side is built with Node.js and Express.js.

-   **`server.js`**: The main entry point for the backend application.
    -   Initializes the Express app and sets up middleware (e.g., `cors`, `express.json` for parsing request bodies).
    -   Connects to the MongoDB database (via `db.js`).
    -   Imports and mounts various API route handlers (auth, invoices, templates, Razorpay).
    -   Configures the `nodemailer` email transporter using SMTP credentials from `.env` variables, with a fallback to Ethereal Email for development. This transporter is made available to routes via `app.set('emailTransporter', transporter)`.
-   **`db.js`**: Contains the logic for connecting to the MongoDB database using Mongoose.
-   **`.env`**: Stores sensitive configuration and environment variables (see "Environment Variables" section below).
-   **`package.json`**: Lists project dependencies (e.g., `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `nodemailer`, `razorpay`, `mailgun-js` - though mailgun might be an alternative that was reverted) and scripts.

### `models/`

Mongoose schemas defining the structure of data in MongoDB:

-   **`Invoice.js`**: Defines the schema for invoices.
    -   Includes fields like `userId` (linking to the User model), `invoiceNumber` (with a compound unique index on `userId` and `invoiceNumber` for user-specific numbering), client details, item lines, total amount, currency.
    -   Stores `companyName`, `companyAddress`, `companyEmail`, and `companyPhone` (auto-filled from the logged-in user's profile).
    -   Tracks payment status (`paymentStatus`: enum 'Pending', 'Paid', 'Failed'), `paymentDate`, and Razorpay payment identifiers (`razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature`).
-   **`User.js`**: Defines the schema for users.
    -   Includes fields like `email` (unique), `password` (hashed), and company details (`companyName`, `companyAddress`, `companyEmail`, `companyPhone`).
-   **`Template.js`**: Defines the schema for user-specific invoice templates (e.g., `name`, `userId`, `extraFields`). While the backend supports CRUD for these via `/api/templates`, the client-side (`LandingPage.jsx`, `CreateInvoicePage.jsx`) currently uses a hardcoded list of templates.

### `routes/`

Defines the API endpoints:

-   **`authRoutes.js`**: Handles user authentication.
    -   `POST /api/auth/register`: Registers a new user.
    -   `POST /api/auth/login`: Logs in an existing user and returns a JWT.
-   **`invoices.js`**: Handles CRUD operations for invoices.
    -   `POST /api/invoices`: Creates a new invoice. Associated with the logged-in user. Automatically fills company details from the user's profile.
        -   Generates a PDF of the invoice using a reusable `generateInvoicePDF` function.
        -   Sends the invoice PDF as an email attachment to the client's email address using `nodemailer` (via `req.app.get('emailTransporter')`). The email includes a "Pay Now" link pointing to `/pay-invoice/:invoiceId` on the client application.
    -   `GET /api/invoices`: Retrieves all invoices for the logged-in user.
    -   `GET /api/invoices/:id`: Retrieves a specific invoice.
    -   `PUT /api/invoices/:id`: Updates an existing invoice.
    -   `DELETE /api/invoices/:id`: Deletes an invoice.
    -   `GET /api/invoices/:id/pdf`: Generates and returns the PDF for a specific invoice.
-   **`templateRoutes.js`**: Handles CRUD operations for user-specific invoice templates (`/api/templates`). Note: Client currently uses a hardcoded list.
-   **`razorpayRoutes.js`**: Integrates with Razorpay for payment processing.
    -   `POST /api/razorpay/orders`: Creates a Razorpay order for a given invoice amount.
    -   `POST /api/razorpay/verify`: Verifies the payment signature from Razorpay. If successful, it updates the corresponding invoice's `paymentStatus` to 'Paid', sets the `paymentDate`, and stores Razorpay transaction details.

### `middleware/`

Contains custom middleware functions:

-   **`authMiddleware.js` (or similar name, e.g., `protect.js`)**: Verifies the JWT token in incoming requests to protect routes that require authentication.

## Key Features Implemented

-   **User Authentication**: Secure registration and login using JWT. Company details are stored per user.
-   **Invoice Management**: Create, Read, Update, Delete (CRUD) operations for invoices.
-   **User-Specific Data**: Invoices and company details are tied to the logged-in user. Invoice numbering is unique per user.
-   **PDF Generation**: Invoices can be generated and downloaded as PDF files.
-   **Email Invoicing**: Automatically emails PDF invoices to clients upon creation. Emails include a "Pay Now" link.
-   **Online Payments**: Integration with Razorpay for processing invoice payments.
    -   Payment status tracking (`Pending`, `Paid`, `Failed`).
-   **Responsive UI**: Styling improvements for better user experience (e.g., `InvoiceList.jsx` using CSS Modules).
-   **Client-Side Routing**: Public and private routes for a seamless single-page application experience.
-   **Customizable Templates (Backend)**: Backend support for user-defined invoice templates (though client currently uses a fixed set).

## Environment Variables (.env)

Create a `.env` file in the `server/` directory with the following variables:

```env
# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Nodemailer SMTP)
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port (e.g., 587 or 465)
EMAIL_SECURE=true_or_false (true for SSL/TLS, false otherwise)
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM_ADDRESS=your_sending_email_address (e.g., "Invoice App <no-reply@example.com>")

# Client Application URL (for links in emails)
CLIENT_APP_URL=http://localhost:3000 (or your deployed client URL)
```

Create a `.env` file in the `client/` directory (if not already present, typically at the root of the client project) with the following variable for Vite:

```env
# Razorpay Key ID for Frontend
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```
Make sure to install all dependencies using `npm install` (or `yarn install`) in both the `client/` and `server/` directories.
Remember to restart the development servers after making changes to `.env` files.

