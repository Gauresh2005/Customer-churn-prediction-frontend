# Customer Churn Prediction – Frontend

A React-based web application that allows users to predict customer churn using a Machine Learning model through an integrated REST API. The application provides an interactive dashboard where users can enter customer information, receive churn predictions, view churn probabilities, and maintain a history of previous predictions.

**Live Demo:** https://customer-churn-prediction-frontend-brown.vercel.app/

**Backend Repository:** [Customer-churn-prediction](https://github.com/Gauresh2005/Customer-churn-prediction)

---

## Overview

This project provides a user-friendly interface for a Customer Churn Prediction system developed using React. It communicates with a backend REST API built using FastAPI, which uses a trained Machine Learning pipeline to predict whether a customer is likely to leave a telecom service.

Users can enter customer details through a structured form and receive predictions along with the corresponding churn probability.

The frontend is designed as a dashboard to make the prediction process simple and accessible.

## Features

- **Customer Information Form:** Collects customer details such as tenure, monthly charges, contract type, internet service, payment method, and other relevant attributes.
- **Machine Learning Predictions:** Sends customer information to the backend API and displays the predicted churn status.
- **Churn Probability:** Displays the probability of a customer churning along with a visual representation.
- **Prediction Dashboard:** Provides summary statistics, including total predictions, churn predictions, and non-churn predictions.
- **Prediction History:** Maintains a history of previous predictions using browser LocalStorage.
- **Form Validation:** Validates required fields, tenure values, and monetary inputs before submitting predictions.
- **API Status Monitoring:** Displays the backend connection status and periodically checks API availability.
- **Error Handling:** Handles API errors, invalid responses, and network connectivity issues.
- **Responsive Design:** Supports desktop, tablet, and mobile screen sizes.
- **Reset Functionality:** Allows users to clear the form and current prediction result.

## Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application logic |
| Vite | Development server and build tool |
| CSS | Styling and responsive layout |
| Lucide React | Icons |
| Fetch API | Backend communication |
| LocalStorage | Storing prediction history |
| Vercel | Frontend deployment |

## Application Architecture

The frontend communicates with the deployed FastAPI backend to obtain predictions.

```text
        User
         |
         v
   React Frontend
         |
         v
   Customer Input Form
         |
         v
   Input Validation
         |
         v
   Fetch API Request
         |
         v
   FastAPI Backend
         |
         v
   ML Prediction Pipeline
         |
         v
   Prediction Response
         |
         v
   React Dashboard
         |
         v
   Display Prediction
   and Churn Probability
```

## Backend Integration

The frontend communicates with the deployed backend through REST API endpoints.

**Backend URL:**

https://customer-churn-prediction-api-e0go.onrender.com

**API Documentation:**

https://customer-churn-prediction-api-e0go.onrender.com/docs

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Checks backend API health |
| POST | `/predict` | Predicts customer churn |

### Sample Prediction Response

```json
{
  "churn_probability": 0.8503,
  "prediction_label": "Churn"
}
```

The frontend uses the prediction response to display the predicted churn status and probability.

## Prediction History

The application stores successful prediction records in the browser's LocalStorage.

Each history entry includes:

- Customer tenure
- Monthly charges
- Contract type
- Predicted churn status
- Churn probability
- Prediction timestamp

The dashboard also provides summary statistics based on the stored prediction history.

**Note:** Prediction history is stored locally in the browser. It is not shared between different users or devices.

## Project Structure

The following is an illustrative project structure. Adjust filenames to match your actual repository.

```text
customer-churn-prediction-frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
└── README.md
```

## Installation and Setup

Follow these steps to run the frontend application locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Gauresh2005/Customer-churn-prediction-frontend
```

### 2. Navigate to the Project Directory

```bash
cd customer-churn-prediction-frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

### 5. Build for Production

```bash
npm run build
```

The production build will be generated in the `dist` directory.

## Deployment

The frontend is deployed using **Vercel**.

The application communicates with the deployed FastAPI backend hosted on Render.

- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Backend Framework:** FastAPI

## Limitations and Future Improvements

- Implement user authentication and role-based access.
- Integrate a database such as PostgreSQL for persistent prediction history.
- Add advanced analytics and visualizations for customer churn patterns.
- Improve accessibility and user experience.
- Explore training the model on datasets representative of different telecom markets.

## Related Repository

**Backend Repository:** https://github.com/Gauresh2005/Customer-churn-prediction

## Author

**Gauresh Barge**

GitHub: https://github.com/Gauresh2005

---