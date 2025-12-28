# RetailPro - Retail Management System

A comprehensive retail management system with professional UI and secure authentication.

## 🚀 Features

- **Professional UI**: Modern, responsive design with green theme and glassy interfaces
- **User Authentication**: Secure signup and login with JWT tokens
- **Dashboard**: Comprehensive dashboard with statistics and management tools
- **MongoDB Integration**: Robust database with user management
- **Security**: Password hashing, rate limiting, CORS protection

## 📁 Project Structure

```
retailer-system/
├── frontend/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── signup.js          # Signup page functionality
│   │   ├── login.js           # Login page functionality
│   │   └── dashboard.js       # Dashboard functionality
│   ├── signup.html            # User registration page
│   ├── login.html             # User login page
│   └── dashboard.html         # Main dashboard
├── backend/
│   ├── config/
│   │   └── database.js        # Database configuration
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   └── User.js            # User model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   └── users.js           # User management routes
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   └── .env.example           # Environment variables template
└── README.md                  # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env` (if available)
   - Or create a `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/retailer-system
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB:**
   - For local MongoDB: Make sure MongoDB is running
   - For MongoDB Atlas: Update MONGODB_URI with your connection string

5. **Start the backend server:**
   ```bash
   npm start          # Production mode
   npm run dev        # Development mode (with nodemon)
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Open the HTML files in your browser:**
   - `signup.html` - User registration
   - `login.html` - User login
   - `dashboard.html` - Main dashboard

   Or serve them using a local server:
   ```bash
   # Using Python
   python -m http.server 3000

   # Using Node.js (install http-server globally first)
   npx http-server -p 3000
   ```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### User Management (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/activate` - Activate user
- `GET /api/users/stats/overview` - Get user statistics

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🎨 UI Features

- **Green Theme**: Professional green color scheme
- **Glassy Interface**: Modern backdrop blur effects
- **Responsive Design**: Works on all device sizes
- **Form Validation**: Real-time validation with user feedback
- **Password Strength**: Visual password strength indicator
- **Loading States**: Smooth loading animations

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Input validation and sanitization
- Account lockout after failed attempts
- Helmet.js for security headers

## 📱 Frontend Pages

### Signup Page (`signup.html`)
- Name, email, phone, business name fields
- Password with strength indicator
- Terms and conditions checkbox
- Professional validation

### Login Page (`login.html`)
- Email and password fields
- Remember me option
- Social login placeholders
- Forgot password link

### Dashboard (`dashboard.html`)
- Statistics cards
- Navigation sidebar
- Recent orders
- Quick actions
- Responsive design

## 🚀 Usage

1. **Start the backend server** (see Backend Setup)
2. **Open the frontend pages** in your browser
3. **Register a new account** using the signup page
4. **Login** with your credentials
5. **Access the dashboard** to manage your retail operations

## 🔧 Development

### Adding New Features

1. **Frontend**: Add new HTML pages, update CSS/JS files
2. **Backend**: Create new routes in `routes/`, add models in `models/`
3. **Database**: Update models and add new collections as needed

### Testing

```bash
# Backend testing
cd backend
npm test

# Manual testing with tools like Postman or curl
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"1234567890","productName":"Test Store","password":"TestPass123","confirmPassword":"TestPass123","terms":"true"}'
```

## 📝 Notes

- The frontend currently uses placeholder API calls
- Update the API endpoints in the JavaScript files to match your backend URL
- For production deployment, ensure proper environment variables are set
- Consider adding HTTPS in production
- Implement proper error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues, please create an issue in the repository or contact the development team.
