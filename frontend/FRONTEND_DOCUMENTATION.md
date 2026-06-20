# Odoo Cafe - Frontend Architecture & Implementation Documentation

This document provides a comprehensive breakdown of the frontend architecture, features, and implementation details for the Odoo Cafe POS system.

## 1. Core Technologies
- **React (Vite):** The core framework used for building the user interface.
- **React Router DOM:** Used for role-based routing and navigation across different dashboards.
- **Socket.io-client:** Enables real-time, bi-directional communication with the backend (e.g., instant order updates, live KDS syncing).
- **Lucide React:** Used for sleek, modern SVG iconography throughout the app.
- **Recharts:** Used for data visualization in the Admin Dashboard.
- **Vanilla CSS:** Custom CSS variables and utility classes (`index.css`) enforce a premium, glassmorphism design system across the entire application without relying on heavy UI libraries.

---

## 2. Global State & Contexts

### `SocketContext.jsx`
Instead of manually connecting to WebSockets in every file, we built a global `SocketProvider`. This wraps the entire application and exposes the `socket` instance to any component that needs it via the `useSocket()` hook. This ensures a single, stable WebSocket connection is maintained.

---

## 3. Routing & Role-Based Access

### `App.jsx` & `SharedLayout.jsx`
The application utilizes a robust routing system that protects specific views based on the logged-in user's role (`Admin`, `Cashier`, `Kitchen`, `Servant`).
- **`ProtectedRoute.jsx`:** Checks `localStorage` for the active `userRole`. If a user tries to access a route they don't have permission for, it boots them back to the login screen.
- **`SharedLayout.jsx`:** Serves as the global wrapper for Admin and Cashier views. It renders the persistent side navigation bar and also mounts the **Global Verification Alerts**. Kitchen and Servant views bypass this layout to run in "Full Screen" mode on dedicated tablets.

---

## 4. Component Breakdown (Feature by Feature)

### 📊 The Admin Command Center
- **`Dashboard.jsx`:** The main hub for Admins. It fetches live analytics (Revenue, Active Orders) and displays them using glass-card metrics. It also provides an Employee Management section to create new staff accounts.
- **`Reports.jsx`:** A ledger-style accounting page. We moved away from complex charts here to provide a practical, "date-wise" accordion view. Admins can click on any specific date to expand it and see the exact orders, items, and revenue generated that day. Features a CSV export function.
- **`MenuManager.jsx`:** A full CRUD interface for managing Categories and Products. Crucially, it includes a `requiresKitchen` toggle, allowing admins to dictate whether an item (like a Frappe) goes to the chef, or if it bypasses the kitchen entirely (like a Bottled Water).

### 🏪 Cashier & Floor Management
- **`FloorPlan.jsx`:** A highly interactive visual representation of the cafe tables. Tables change color in real-time based on Socket events:
  - 🟢 **Green (Active):** Customers are seated and have placed an order.
  - 🟠 **Orange (Served):** All food has been delivered to the table.
  - ⚪ **White (Vacant):** The table is empty and ready for new customers.
- **`OrderView.jsx`:** The tablet interface for Cashiers to manually punch in orders. It categorizes items horizontally and calculates taxes dynamically. It intelligently filters KDS assignments based on the `requiresKitchen` flag.
- **`PaymentModal.jsx`:** A beautiful overlay that handles bill settlement. It features a custom numpad for Cash calculations (showing exact change due) and integrates the UPI QR generator.

### 👨‍🍳 Kitchen & Servant Monitors
- **`KDS.jsx` (Kitchen Display System):** A specialized, full-screen Kanban board for chefs. It only receives items marked with `requiresKitchen: true`. Chefs can tap items to mark them "Ready", which instantly pings the Servant Monitor.
- **`ServantPortal.jsx`:** A simplified grid for waiters. It displays which tables need to be served. Once food is dropped off, the waiter clicks "Mark as Served", turning the table Orange on the Cashier's Floor Plan.

### 📱 Customer Self-Service (QR Mode)
- **`CustomerMenu.jsx`:** The mobile-first interface customers see when they scan a table's QR code. It provides a sleek, categorized menu, a persistent shopping cart, and a "My Bill" section.
- Customers can place orders directly to the kitchen from their phones.
- **`QRGenerator.jsx`:** A utility for the admin to print physical QR codes to place on physical cafe tables.

---

## 5. The Payment & Verification Flow

To achieve a 100% cashless, zero-hardware payment system, we built a highly customized **Cashier Verification Flow**.

### The Problem Solved
Static UPI QR codes (`upi://pay?pa=...`) cannot automatically communicate success back to a server without expensive payment gateway APIs (like Razorpay). We needed a way to prevent customers from just clicking "I Have Paid" without actually paying.

### The Flow Implementation
1. **QR Generation:** In `CustomerMenu.jsx`, when the customer clicks "Pay", we generate a dynamic QR code using `qrcode.react`. The QR code contains the cafe's exact UPI ID (`7010496249@nyes`) and the exact bill amount injected as variables.
2. **The Claim:** When the customer clicks the green "I Have Paid" button, `CustomerMenu.jsx` fires an API call to `/claim` and transitions into a "Waiting for Verification" loading screen.
3. **The Global Alert:** The backend emits a `payment_claim_raised` socket event. The `VerificationAlerts.jsx` component (which is globally mounted in the `SharedLayout.jsx`) catches this event and slides a high-priority yellow alert onto the Cashier's screen, no matter what page they are on.
4. **The Resolution:** The Cashier checks their phone/soundbox. If they see the money, they click "Approve" on the alert. This sends a `payment_verified` socket event back to the Customer's phone, instantly unlocking their screen to a green Success Page and clearing the table.

---

## 6. Key Functions and Methods Breakdown

Below is a reference of the primary operational functions utilized across the main frontend components to drive application logic.

### `Login.jsx` & `Register.jsx`
- **`handleLogin(e)` / `handleRegister(e)`:** Captures form data on submission. Performs a `POST` request to the backend `/api/auth` endpoints. On success, decodes the JWT response, stores `userToken` and `userRole` in `localStorage`, and dynamically routes the user to their respective dashboard using `useNavigate()`.

### `FloorPlan.jsx`
- **`fetchTables()`:** Called on component mount via `useEffect`. Fetches the current state (status, order ID) of all defined tables from the database.
- **`handleTableClick(table)`:** Triggered when a cashier taps a table block. If the table is "Vacant", it opens an empty `OrderView` to begin punching a new order. If "Active", it opens `OrderView` with the existing cart pre-loaded. If "Served", it opens the `PaymentModal` for checkout.

### `OrderView.jsx`
- **`fetchMenu()`:** Retrieves the categorized menu from the backend so items can be mapped to UI cards.
- **`addToCart(item)`:** Checks if an item already exists in the local `cart` state array. If yes, increments `qty`. If no, pushes a new object with `{...item, qty: 1}`.
- **`updateQty(index, delta)`:** Adjusts the quantity of a cart item based on the +/- buttons. Automatically splices (removes) the item if `qty` drops to 0.
- **`handleSendToKitchen()`:** Compiles the current cart and sends a `POST` request to create or update an Order. Only payload items with `requiresKitchen === true` trigger kitchen socket events. Sets the table status to "Active".

### `PaymentModal.jsx`
- **`handleCheckout(method)`:** Processes the final bill settlement. `method` can be 'Cash' or 'UPI'. On success, triggers a `POST` to `/api/orders/:id/checkout`, clears the cart, and resets the target table back to "Vacant".

### `KDS.jsx` (Kitchen)
- **`fetchActiveOrders()`:** Retrieves all orders currently marked as "Preparing" from the database and maps their items to the Kanban board.
- **`markItemReady(orderId, itemId)`:** Emits a socket event to the backend indicating a specific food item is cooked. The backend updates the database and pushes the event to the `ServantPortal`.

### `ServantPortal.jsx`
- **`fetchPendingDeliveries()`:** Fetches all meals that the kitchen has marked as "Ready" but haven't been delivered yet.
- **`markDelivered(orderId, itemId)`:** Confirms that a waiter has dropped the food at the table. Once all items in an order are delivered, this automatically upgrades the overall table status to "Served", turning it orange on the cashier's screen.

### `CustomerMenu.jsx`
- **`handleClaimPayment()`:** Triggered when a customer clicks "I Have Paid" on the QR overlay. Sends a specific API request that triggers the global `payment_claim_raised` socket event, broadcasting the claim to the Cashier.
- **Socket Listeners (`useEffect`):** Actively listens for the `payment_verified` event from the cashier. When received, it instantly clears the customer's cart and shows the "Payment Successful" confirmation screen.
