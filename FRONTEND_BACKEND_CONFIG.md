# Frontend-Backend Configuration

## 🔗 Connection Details

### Backend API
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **CORS**: Enabled for all localhost origins

### Frontend
- **URL**: http://localhost:3000
- **API Calls**: All requests go to `http://localhost:5000/api/`

## 🚀 API Endpoints

### Authentication
- **Signup**: `POST /api/auth/signup`
- **Login**: `POST /api/auth/login`
- **Profile**: `GET /api/auth/me` (requires token)
- **Update Profile**: `PUT /api/auth/update-profile` (requires token)

### User Management
- **List Users**: `GET /api/users` (admin only)
- **Get User**: `GET /api/users/:id`
- **Update User**: `PUT /api/users/:id` (admin only)
- **Delete User**: `DELETE /api/users/:id` (admin only)

## 🔐 Authentication Flow

1. **Signup** → User fills form → API validates → Creates account → Returns JWT token → Redirects to login
2. **Login** → User enters credentials → API validates → Returns JWT token → Stores in localStorage → Redirects to dashboard
3. **Dashboard** → Checks for valid token → API verifies token → Shows dashboard or redirects to login

## 📊 Data Flow

### Signup Data Sent:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "1234567890",
  "productName": "Business Name",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "terms": "true"
}
```

### Login Data Sent:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "remember": true/false
}
```

## 🛡️ Security

- **CORS**: Configured to allow frontend requests
- **JWT**: Tokens stored in localStorage/sessionStorage
- **Validation**: Server-side validation on all inputs
- **Error Handling**: Comprehensive error messages

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### API Test
```bash
# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"1234567890","productName":"Test","password":"Test123","confirmPassword":"Test123","terms":"true"}'
```

## 🚨 Troubleshooting

### CORS Issues
- ✅ Backend allows all localhost origins
- ✅ Frontend includes proper headers
- ✅ Check browser console for CORS errors

### Connection Issues
- ✅ Backend running on port 5000
- ✅ Frontend making requests to correct URL
- ✅ MongoDB connected (check backend logs)

### Validation Issues
- ✅ Frontend validates before sending
- ✅ Backend validates all inputs
- ✅ Clear error messages displayed

## 🔄 Redirect Flow

1. **Page Load** → Check for existing token
2. **No Token** → Stay on login page
3. **Signup Success** → Store success message → Redirect to login
4. **Login Success** → Store token → Redirect to dashboard
5. **Invalid Token** → Clear storage → Redirect to login
