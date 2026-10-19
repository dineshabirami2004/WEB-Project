# PocketPal — Expense Tracker (Frontend Mini Project)

A colorful, responsive expense tracker built with **HTML, CSS, and vanilla JavaScript**.

## Features
- Summary cards for balance, total income, and total expenses
- Add income and expense transactions
- Categories, amount, date, and description
- Search and filter transactions
- Delete individual transactions or clear all
- Monthly expense bar chart and top expense categories
- Saves transactions in browser LocalStorage
- Responsive layout for desktop and mobile

## Folder structure
```text
expense_tracker_project/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to run
1. Download and extract the project ZIP.
2. Open the `expense_tracker_project` folder.
3. Double-click `index.html` to open it in Chrome, Edge, or Firefox.
4. Click **Add transaction** and enter your income or expense.
5. Refresh the page: saved transactions should remain in the same browser.

No server, backend, database, or package installation is required.

## Important note
Data is stored in the browser's LocalStorage on that device/browser. It is not synced online and can be removed if browser site data is cleared. For a real multi-user app, a backend and database would be needed.

## Technologies
- **HTML:** page structure and forms
- **CSS:** layout, colors, responsive styling, cards and modal
- **JavaScript:** calculations, validation, search, filters, chart rendering, LocalStorage

## Suggested mini-project explanation
“PocketPal is a frontend expense tracking web application. It helps users record income and expenses, view their current balance, filter transactions, and understand monthly spending. HTML structures the interface, CSS provides the responsive design, and JavaScript handles transaction operations and calculations. LocalStorage keeps the data in the browser after refresh.”
