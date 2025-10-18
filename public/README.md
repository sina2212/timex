# TimeX Frontend Documentation

## Overview

This is a comprehensive frontend application for the TimeX attendance management system. It provides a modern, responsive interface for all backend endpoints with Persian (RTL) support.

## Features

### 🔐 Authentication

- **User Registration**: Create new user accounts with full name, username, password, and phone number
- **User Login**: Secure login with JWT token authentication
- **Auto-logout**: Handles token expiration and unauthorized access

### ⏰ Attendance Management

- **Check-in**: Record employee arrival time with GPS location
- **Check-out**: Record employee departure time with GPS location
- **Real-time Duration**: Live tracking of work hours during active sessions
- **Status Display**: Clear visual indication of current attendance status

### 👤 Profile Management

- **Update Information**: Edit username and phone number
- **Change Password**: Secure password modification
- **User Data Display**: Show current user information

### 👥 User Management

- **View All Users**: Display list of all registered users (admin feature)
- **User Details**: Show user information including ID, name, username, and phone

### 📱 Additional Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Clock**: Always-visible current time display
- **GPS Location**: Automatic location detection for attendance tracking
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Visual feedback during API operations
- **Persian Language**: Full RTL support with Persian text

## API Endpoints Covered

### Authentication Endpoints

- `POST /register` - User registration
- `POST /login` - User authentication

### Attendance Endpoints

- `POST /in` - Check-in (requires authentication)
- `POST /out` - Check-out (requires authentication)

### User Management Endpoints

- `GET /users` - Get all users (requires authentication)
- `PATCH /users` - Update user information (requires authentication)
- `PUT /users` - Change password (requires authentication)

## File Structure

```
public/
├── index.html      # Main HTML structure
├── styles.css      # Complete CSS styling
└── app.js          # JavaScript application logic
```

## Setup Instructions

### 1. Backend Setup

Make sure your backend server is running and the following is configured:

1. **Static File Serving**: The `express.static` middleware should be configured to serve files from the `public` directory (already added to your app.js)

2. **CORS Configuration** (if frontend and backend are on different ports):

```javascript
// Add to your app.js
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000", // or your frontend URL
    credentials: true,
  })
);
```

### 2. Frontend Configuration

Update the API base URL in `app.js` if your backend runs on a different port:

```javascript
this.apiBaseUrl = "http://localhost:3000"; // Change to your backend URL
```

### 3. Access the Application

Once your backend server is running, navigate to:

```
http://localhost:3000
```

## Component Details

### Authentication Flow

1. **Login**: Users enter credentials → Token received → Stored in localStorage → Dashboard displayed
2. **Registration**: New users fill form → Account created → Redirected to login
3. **Logout**: Token removed → Redirected to login screen

### Attendance Flow

1. **Location Detection**: GPS coordinates automatically detected
2. **Check-in**: Current time + location sent to backend → Session started
3. **Duration Tracking**: Real-time display of work hours
4. **Check-out**: End time + location sent → Session completed

### Error Handling

- Network errors are caught and displayed as toast notifications
- Form validation prevents incomplete submissions
- Token expiration automatically triggers logout
- Location errors are handled gracefully

### Security Features

- JWT tokens stored securely in localStorage
- Automatic token validation on API calls
- Protected routes require authentication
- Input sanitization and validation

## Browser Support

- Chrome 70+ ✅
- Firefox 65+ ✅
- Safari 12+ ✅
- Edge 79+ ✅

## Mobile Support

- Responsive design works on all screen sizes
- Touch-friendly interface
- GPS location detection on mobile devices
- Optimized for mobile browsers

## Customization

### Styling

The CSS uses CSS custom properties for easy theming. Key color variables:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #56ab2f;
  --error-color: #ff416c;
  --warning-color: #ffa726;
}
```

### API Integration

To add new endpoints, extend the `apiCall` method in `app.js` and add corresponding UI components.

### Translations

All text is in Persian. To add other languages, create translation objects and modify the text content dynamically.

## Development Notes

### Code Structure

- **Class-based Architecture**: Main application logic in `TimeXApp` class
- **Event-driven**: Extensive use of event listeners for user interactions
- **Async/Await**: Modern JavaScript patterns for API calls
- **Error Handling**: Comprehensive try-catch blocks

### Performance Optimizations

- Efficient DOM manipulation
- Debounced API calls where appropriate
- Minimal external dependencies
- Optimized CSS with flexbox and grid

### Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast color scheme

## Troubleshooting

### Common Issues

1. **Login fails**: Check if backend server is running and API URL is correct
2. **Location not detected**: Ensure HTTPS (required for geolocation) or localhost
3. **Styling issues**: Verify Vazir font loads correctly
4. **API errors**: Check browser console for detailed error messages

### Debug Mode

Enable console logging by adding this to the beginning of `app.js`:

```javascript
const DEBUG = true;
// Then use: if (DEBUG) console.log('Debug message');
```

## Future Enhancements

Potential improvements that could be added:

- **Dashboard Analytics**: Charts and statistics
- **Multiple Location Support**: Different office locations
- **Offline Mode**: PWA functionality for offline use
- **Push Notifications**: Reminders for check-in/out
- **Advanced Reporting**: Export attendance data
- **Admin Panel**: User management interface
- **Calendar Integration**: View attendance history
- **Dark Mode**: Alternative color scheme

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify backend API responses
3. Ensure all files are properly served
4. Check network connectivity

The frontend provides a complete, production-ready interface for your TimeX attendance management system with modern web standards and excellent user experience.
