# Nature Nomads App

API documentation is available at:
[Postman Documentation](https://documenter.getpostman.com/view/36460861/2sA3rwMuDE)


## Introduction
I built an e-commerce platform using Node.js, Express.js, MongoDB, JavaScript, HTML, CSS, and Pug. The platform allows users to view tours of nature and inspect their details pages.  The page is fully functional as an e-commerce platform where users can create profiles, book tours with guides, and explore the world 🌎 ⛰️🌊🌲

## Tech Stack

### Front-End
- **JavaScript**
- **HTML**
- **CSS**
- **Pug**

### Back-End
- **Node.js**
- **Express.js**
- **Mongoose**
- **MongoDB**

### Testing
- **Jest**
- **SuperTest**

### DevOps (CI/CD)
- **GitHub Actions**

## Features
- **User Profiles:** Create and manage personal profiles.
- **Tour Booking:** Browse available tours and book directly through the platform.
- **Detailed Tour Pages:** View comprehensive information about each tour.
- **Secure Payments:** Integrate with Stripe for secure and reliable payment processing.


## Setup and Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/davidjriva/nature-nomads.git
   cd nature-nomads
2. **Install Dependencies:**
    ```bash
    npm install
3. **Configure Environment Variables:**
    
    Create a '.env' file in the root directory with the necessary environment variables
    ```bash
    NODE_ENV=development-or-production
    PORT=a-port-number
    USERNAME=your-username

    DATABASE=your-mongodb-atlas-connection-string
    DATABASE_PASSWORD=your-mongodb-atlas-password

    JWT_SECRET=your-jwt-secret
    JWT_EXPIRES_IN=a-date
    JWT_COOKIE_EXPIRES_IN=a-date

    # Configuration for mailtrap.io (Development Email Testing Site)
    EMAIL_HOST=sandbox.smtp.mailtrap.io
    EMAIL_USERNAME=sandbox-email-username
    EMAIL_PASSWORD=sandbox-email-password
    EMAIL_PORT=2525
    EMAIL_FROM=application-email-username@application-email-address

    # Configuration for Stripe (Payment Processing)
    STRIPE_SECRET_KEY=your-stripe-secret-key
    ```
4. **Run The Application:**
    - Starting the server in development mode:
    ```bash
    npm run start:dev
    ```
    - Starting the server in production mode:
    ```bash
    npm run start:dev
    ```
    - Building the application:
    ```bash
    npm build
    ```
    - Testing the application:
    ```bash
    npm test    
    ```