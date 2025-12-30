# SunoApp Development Guide

Guide for local development and testing.

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- MySQL 8.0+
- Git

### Backend Setup

1. **Create Python virtual environment:**

```bash
cd SunoApp/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Set up local database:**

```bash
# Create database
mysql -u root -p
CREATE DATABASE sunoapp_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sunoapp_dev'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON sunoapp_dev.* TO 'sunoapp_dev'@'localhost';
FLUSH PRIVILEGES;
exit;

# Import schema
mysql -u root -p sunoapp_dev < ../database/schema.sql
```

4. **Create `.env` file:**

```bash
cp .env.example .env
```

Edit `.env`:
```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sunoapp_dev
DB_USER=sunoapp_dev
DB_PASSWORD=devpassword
JWT_SECRET_KEY=dev-jwt-secret
JWT_ACCESS_TOKEN_EXPIRES=86400
CORS_ORIGINS=http://localhost:3000
API_PREFIX=/api/v1
```

5. **Run Flask development server:**

```bash
python run.py
```

Backend will be available at http://localhost:5000

### Frontend Setup

1. **Install dependencies:**

```bash
cd SunoApp/frontend
npm install
```

2. **Create `.env` file:**

```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_NAME=SunoApp
```

3. **Run React development server:**

```bash
npm start
```

Frontend will be available at http://localhost:3000

## Development Workflow

### Making Changes

1. **Backend changes:**
   - Edit files in `backend/app/`
   - Flask dev server auto-reloads
   - Test with Postman or curl

2. **Frontend changes:**
   - Edit files in `frontend/src/`
   - React dev server hot-reloads
   - Test in browser at http://localhost:3000

3. **Database changes:**
   - Update `database/schema.sql`
   - Create migration script if needed
   - Test on local database first

### Testing

#### Manual Testing

1. Start backend: `python run.py`
2. Start frontend: `npm start`
3. Test in browser

#### API Testing with curl

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create song
curl -X POST http://localhost:5000/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"specific_title":"Test","specific_lyrics":"Test lyrics","style_id":1,"vocal_gender":"male"}'
```

## Project Structure

```
SunoApp/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # Database models
│   │   └── routes/              # API endpoints
│   │       ├── auth.py          # Authentication
│   │       ├── songs.py         # Songs CRUD
│   │       ├── styles.py        # Styles CRUD
│   │       └── webhooks.py      # Webhooks for n8n
│   ├── config.py                # Configuration
│   ├── run.py                   # Entry point
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── SongCard.js      # Song display card
│   │   │   ├── SongModal.js     # Add/Edit song modal
│   │   │   └── StyleModal.js    # Add/Edit style modal
│   │   ├── pages/               # Page components
│   │   │   ├── Login.js         # Login/Register page
│   │   │   ├── Home.js          # Song management page
│   │   │   └── ManageStyles.js  # Style management page
│   │   ├── services/            # API services
│   │   │   ├── api.js           # Axios instance
│   │   │   ├── auth.js          # Auth API calls
│   │   │   ├── songs.js         # Songs API calls
│   │   │   └── styles.js        # Styles API calls
│   │   ├── App.js               # Main app component
│   │   └── index.js             # Entry point
│   └── package.json             # npm dependencies
├── database/
│   └── schema.sql               # Database schema
├── deploy/                      # Deployment scripts
└── docs/                        # Documentation
```

## Common Development Tasks

### Add a New API Endpoint

1. **Create route in backend:**

```python
# backend/app/routes/songs.py
@bp.route('/my-endpoint', methods=['GET'])
@jwt_required()
def my_endpoint():
    return jsonify({'message': 'Hello'}), 200
```

2. **Add service in frontend:**

```javascript
// frontend/src/services/songs.js
export const myEndpoint = async () => {
  const response = await api.get('/songs/my-endpoint');
  return response.data;
};
```

3. **Use in component:**

```javascript
// frontend/src/pages/Home.js
import { myEndpoint } from '../services/songs';

const data = await myEndpoint();
```

### Add a New Database Table

1. **Update schema:**

```sql
-- database/schema.sql
CREATE TABLE my_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Create model:**

```python
# backend/app/models.py
class MyTable(db.Model):
    __tablename__ = 'my_table'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

3. **Create routes:**

```python
# backend/app/routes/my_table.py
# Add CRUD operations
```

### Add a New React Page

1. **Create page component:**

```javascript
// frontend/src/pages/MyPage.js
import React from 'react';

function MyPage() {
  return <div>My Page</div>;
}

export default MyPage;
```

2. **Add route:**

```javascript
// frontend/src/App.js
import MyPage from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />
```

## Debugging

### Backend Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use print statements
print(f"Debug: {variable}")
```

### Frontend Debugging

```javascript
// Use browser console
console.log('Debug:', variable);

// React DevTools
// Install React DevTools browser extension
```

### Database Debugging

```bash
# Connect to database
mysql -u sunoapp_dev -p sunoapp_dev

# Check tables
SHOW TABLES;

# Query data
SELECT * FROM songs;

# Check user
SELECT * FROM users;
```

## Code Style

### Backend (Python)

- Follow PEP 8
- Use type hints where helpful
- Document functions with docstrings
- Keep functions small and focused

### Frontend (JavaScript)

- Use functional components
- Use hooks (useState, useEffect)
- Keep components small and reusable
- Use meaningful variable names

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub (if using)
```

## Troubleshooting

### Backend won't start

- Check Python version: `python --version`
- Check virtual environment is activated
- Check database connection in `.env`
- Check for syntax errors

### Frontend won't start

- Delete `node_modules` and run `npm install` again
- Check Node version: `node --version`
- Clear npm cache: `npm cache clean --force`

### Database connection failed

- Check MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Check database exists: `SHOW DATABASES;`

### CORS errors

- Check `CORS_ORIGINS` in backend `.env`
- Check API URL in frontend `.env`
- Check browser console for exact error
