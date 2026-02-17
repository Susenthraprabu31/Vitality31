# FastAPI Backend

This is a FastAPI backend generated for your application.

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up your environment variables:
   - Copy the `.env` file and update it with your actual database credentials
   - Make sure your `DATABASE_URL` is correctly configured for your database

3. Initialize the database:
   ```bash
   python database/init_db.py
   ```

4. Run the server:
   ```bash
   python main.py
   ```

5. Access the API documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

- GET / - Check if the API is running
- Additional endpoints based on your application needs

## Environment Variables

Configure the following environment variables in your `.env` file:

```env
# Database configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# API settings
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:8001
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

```

## Database Setup

This application uses PostgreSQL as the database. Make sure you have:

1. A PostgreSQL database instance running
2. Proper connection credentials configured in your `.env` file
3. The database initialized using the init script

### For Supabase Users

If you're using Supabase, your `DATABASE_URL` should look like:
```
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

You can find your connection details in your Supabase dashboard under Settings > Database.

## Troubleshooting

### Database Connection Issues

If you get a `NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:https` error:

1. Check that your `DATABASE_URL` starts with `postgresql://` and not `https://`
2. Verify your database credentials are correct
3. Ensure the database server is accessible from your application

### Missing Dependencies

If you get import errors, make sure you've installed all requirements:
```bash
pip install -r requirements.txt
```
