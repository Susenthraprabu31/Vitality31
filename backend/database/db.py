import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus
from fastapi import Request

# Load environment variables
load_dotenv()

# Database connection URL from environment or fallback
# Use the URL from .env file if available, otherwise use the provided URL
raw_db_url = os.getenv("DATABASE_URL", "postgresql://postgres.ntkkfjdakmpheptyglmf:3hurdredand7@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")

# Handle URL encoding for special characters in password
if 'postgresql://' in raw_db_url and '%' not in raw_db_url and '@' in raw_db_url:
    # Extract parts of the URL to properly encode the password
    parts = raw_db_url.split('@')
    if len(parts) == 2 and ':' in parts[0]:
        auth_parts = parts[0].split(':')
        if len(auth_parts) >= 3:  # postgresql://username:password
            # Extract username and password
            prefix = ':'.join(auth_parts[:-1]) + ':'
            password = auth_parts[-1]
            # Encode password and reconstruct URL
            encoded_password = quote_plus(password)
            DATABASE_URL = f"{prefix}{encoded_password}@{parts[1]}"
        else:
            DATABASE_URL = raw_db_url
    else:
        DATABASE_URL = raw_db_url
else:
    DATABASE_URL = raw_db_url

# Create SQLAlchemy engine with connection pool configuration
# This helps handle connection failures and provides automatic retry
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Maximum number of connections beyond pool_size
    pool_pre_ping=True,  # Validate connections before using them
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False  # Set to True for SQL query logging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db(request: Request):
    db = SessionLocal()
    try:
        # Apply per-request RLS context if provided
        user_id = request.headers.get('x-user-id')
        tenant_id = request.headers.get('x-tenant-id')
        if user_id:
            try:
                db.execute(text("SET LOCAL app.user_id = :uid"), {"uid": user_id})
            except Exception:
                pass
        if tenant_id:
            try:
                db.execute(text("SET LOCAL app.tenant_id = :tid"), {"tid": tenant_id})
            except Exception:
                pass
        yield db
    finally:
        db.close()
