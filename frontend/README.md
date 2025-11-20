# Form Engine Frontend

React application for interacting with the Dynamic Form Engine API.

## Features

- ✅ Dynamic form rendering based on API responses
- ✅ Multi-page form navigation
- ✅ Conditional field visibility
- ✅ Real-time form progress tracking
- ✅ Support for all field types (text, number, select, radio, checkbox, rating, etc.)
- ✅ Responsive design with Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8000

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Usage

1. **Start the backend server:**
   ```bash
   cd ..
   python3 -m uvicorn app.main:app --reload
   ```

2. **Create a form using the API:**
   ```bash
   python examples/create_form_example.py
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **View forms:**
   - Navigate to http://localhost:3000
   - Click on any form to start filling it out
   - Forms will automatically handle multi-page navigation and conditional fields

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   └── FieldRenderer.tsx  # Renders different field types
│   ├── pages/           # Page components
│   │   ├── Home.tsx     # Form listing page
│   │   ├── FormView.tsx # Form filling interface
│   │   └── FormBuilder.tsx # Builder info page
│   ├── services/        # API integration
│   │   └── api.ts       # API client and types
│   ├── App.tsx          # Main app component
│   └── main.tsx        # Entry point
├── package.json
└── vite.config.ts
```

## API Integration

The frontend uses the `formAPI` service to interact with the backend:

- `getForms()` - Get all active forms
- `renderForm()` - Get current page to display
- `createSubmission()` - Start a new form submission
- `submitAnswer()` - Submit a field answer
- `getSubmission()` - Get submission status
- `completeSubmission()` - Mark submission as complete

## Field Types Supported

- Text, Email, Phone
- Textarea
- Number
- Date, DateTime
- Select (dropdown)
- Radio buttons
- Checkboxes
- Boolean (yes/no)
- Rating (star rating)

## Features

### Conditional Field Visibility

Fields automatically show/hide based on conditions defined in the backend. The frontend respects the `is_visible` property returned by the API.

### Multi-Page Navigation

Forms automatically navigate between pages based on:
- Navigation rules defined in the backend
- Answers submitted by the user
- Form completion status

### Progress Tracking

A progress bar shows form completion percentage, calculated by the backend based on current page position.

## Troubleshooting

### API Connection Issues

- Ensure the backend is running on http://localhost:8000
- Check CORS settings in the backend
- Verify `VITE_API_URL` in `.env` file

### Forms Not Loading

- Check browser console for errors
- Verify API endpoints are accessible
- Ensure forms are marked as `is_active: true` in the backend

## License

MIT

