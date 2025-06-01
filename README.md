# Event Planner India &#127881;

Welcome to **Event Planner India**, your AI-powered assistant for crafting memorable Indian events! Whether you're planning a wedding, a corporate gathering, or a festive celebration, our tool helps you design the perfect event tailored to your preferences, budget, and the rich traditions of India.

**Live Site:** [event-planner-india.netlify.app](https://event-planner-india.netlify.app/)

## ✨ Features

*   **AI-Powered Planning:** Get instant, personalized event plans based on your inputs (event type, location, budget, guest count).
*   **Indian Culture Focus:** Designs and suggestions that respect and celebrate Indian traditions.
*   **Budget Optimization:** Smart allocation of resources to make the most of your budget.
*   **Downloadable Plans:** Save your generated event plans as a text file.
*   **Responsive Design:** Plan your events on any device.

## &#x1F680; Tech Stack

*   **Frontend:** React, TypeScript, CSS
*   **AI Integration:** Leverages an AI service to generate event plans (details in `src/services/ai.ts`)
*   **Deployment:** Netlify

## &#x1F4BB; Getting Started Locally

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd eventplanner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

4.  **Build for production:**
    ```bash
    npm run build
    ```

## &#x1F310; Deployment

This project is deployed on Netlify. The `_redirects` file in the `public` folder is configured to handle client-side routing for this single-page application.

---

_This project was built with the assistance of an AI pair programmer._
