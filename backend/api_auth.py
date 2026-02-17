"""
Authentication API endpoints for user signup, login, and logout
Handles password hashing, JWT token generation, and session management
"""

from fastapi import APIRouter, HTTPException, Depends, status, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime, timedelta
import uuid
import re
import logging

# Password hashing
from passlib.context import CryptContext

# JWT token generation
from jose import JWTError, jwt

# Database dependencies
from database.db import get_db
# Import ALL models to ensure they register with Base.metadata for dynamic table resolution
from database.models import Base, Formusers_111578632, Formauth_sessions_227409580
from sqlalchemy import inspect

# Response model
from models import ResponseModel

# Router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # TODO: Move to environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ============================================================================
# Dynamic Table Resolution
# ============================================================================

def get_users_table(db: Session):
    """Get the users table directly from the model class"""
    # CRITICAL FIX: Use direct table access instead of metadata.tables lookup
    # This ensures all column definitions are properly loaded
    return Formusers_111578632.__table__

def get_sessions_table(db: Session):
    """Get the sessions table directly from the model class"""
    # CRITICAL FIX: Use direct table access instead of metadata.tables lookup
    # This ensures all column definitions are properly loaded
    return Formauth_sessions_227409580.__table__

# ============================================================================
# Request/Response Models
# ============================================================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 3:  # Minimum password length
            raise ValueError('Password must be at least 3 characters long')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    success: bool
    token: str
    user_id: str
    user: dict
    message: str

# ============================================================================
# Helper Functions
# ============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    """Get user by email address using dynamic table resolution"""
    users_table = get_users_table(db)
    result = db.execute(users_table.select().where(users_table.c.email == email))
    return result.first()

def create_or_update_session(db: Session, user_id: uuid.UUID, token: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
    """
    Create or update session record for user with single-session-per-user policy.
    
    This function implements a secure session management system that ensures:
    - Only one active session exists per user at any time
    - Expired sessions are automatically deleted before creating/updating
    - Race conditions are prevented using row-level locking (SELECT FOR UPDATE)
    - All operations are atomic within a transaction
    
    Args:
        db: Database session
        user_id: UUID of the user
        token: JWT access token for the session
        ip_address: Optional IP address of the client
        user_agent: Optional user agent string
    
    Returns:
        dict: Session data with keys: id, user_id, token, ip_address, user_agent, 
              created_at, expires_at, updated_at (if column exists)
    
    Raises:
        HTTPException: If database operation fails
    """
    logger = logging.getLogger(__name__)
    sessions_table = get_sessions_table(db)
    expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    try:
        # Use SELECT FOR UPDATE to lock the row and prevent race conditions
        # This ensures atomicity: no other transaction can modify this session
        # until the current transaction completes
        existing_session = db.execute(
            sessions_table.select()
            .where(sessions_table.c.user_id == user_id)
            .with_for_update()
        ).first()
        
        # Delete expired sessions before processing
        # This prevents expired sessions from being revived and cleans up database
        if existing_session:
            session_dict = dict(existing_session._mapping) if hasattr(existing_session, '_mapping') else dict(existing_session)
            expires_at_value = session_dict.get('expires_at')
            
            # Check if session is expired
            if expires_at_value and expires_at_value < datetime.utcnow():
                logger.info(f"Deleting expired session for user_id: {user_id}")
                db.execute(sessions_table.delete().where(sessions_table.c.user_id == user_id))
                # Don't commit here - keep lock until entire operation completes
                existing_session = None
        
        # Prepare common session data structure
        session_id = None
        created_at = datetime.utcnow()
        
        if existing_session:
            # Update existing active session
            session_dict = dict(existing_session._mapping) if hasattr(existing_session, '_mapping') else dict(existing_session)
            session_id = session_dict.get('id')
            created_at = session_dict.get('created_at', datetime.utcnow())
            
            update_data = {
                'token': token,
                'expires_at': expires_at,
                'ip_address': ip_address,
                'user_agent': user_agent
            }
            
            # Only update updated_at if column exists
            if 'updated_at' in sessions_table.c:
                update_data['updated_at'] = datetime.utcnow()
            
            db.execute(
                sessions_table.update()
                .where(sessions_table.c.user_id == user_id)
                .values(**update_data)
            )
            db.commit()
            logger.info(f"Updated session for user_id: {user_id}")
        else:
            # Create new session
            session_id = uuid.uuid4()
            session_data = {
                'id': session_id,
                'user_id': user_id,
                'token': token,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'created_at': created_at,
                'expires_at': expires_at
            }
            
            # Only include updated_at if column exists
            if 'updated_at' in sessions_table.c:
                session_data['updated_at'] = datetime.utcnow()
            
            db.execute(sessions_table.insert().values(**session_data))
            db.commit()
            logger.info(f"Created new session for user_id: {user_id}")
        
        # Return consistent structure from both code paths
        result = {
            'id': session_id,
            'user_id': user_id,
            'token': token,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': created_at,
            'expires_at': expires_at
        }
        
        # Include updated_at if column exists
        if 'updated_at' in sessions_table.c:
            result['updated_at'] = datetime.utcnow()
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        db.rollback()
        raise
    except Exception as e:
        # Rollback transaction on any database error
        db.rollback()
        logger.error(f"Error in create_or_update_session for user_id {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error managing session: {str(e)}"
        )

# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/signup", response_model=dict)
async def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    User signup endpoint
    Creates a new user account with hashed password and generates authentication token
    """
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = hash_password(request.password)
        
        # Get users table
        users_table = get_users_table(db)
        
        # Create new user
        new_user_data = {
            'id': uuid.uuid4(),
            'email': request.email,
            'username': request.username or request.email.split('@')[0],
            'first_name': request.first_name,
            'last_name': request.last_name,
            'password_hash': hashed_password,
            'is_active': True,
            'is_verified': False,  # Email verification can be added later
            'is_superuser': False,
            'permissions': {},
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert user
        db.execute(users_table.insert().values(**new_user_data))
        db.commit()
        
        # Generate JWT token
        access_token = create_access_token(
            data={"sub": str(new_user_data['id']), "email": new_user_data['email']}
        )
        
        # Create or update session record
        create_or_update_session(db, new_user_data['id'], access_token)
        
        # Prepare user data for response
        user_data = {
            "id": str(new_user_data['id']),
            "email": new_user_data['email'],
            "username": new_user_data['username'],
            "first_name": new_user_data.get('first_name'),
            "last_name": new_user_data.get('last_name'),
            "is_active": new_user_data['is_active'],
            "is_verified": new_user_data['is_verified'],
            "created_at": new_user_data['created_at'].isoformat() if new_user_data.get('created_at') else None
        }
        
        return {
            "success": True,
            "message": "User created successfully",
            "token": access_token,
            "user_id": str(new_user_data['id']),
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    Authenticates user and generates new session token
    """
    try:
        # Find user by email
        user_row = get_user_by_email(db, request.email)
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Convert row to dict for easier access
        user = dict(user_row._mapping) if hasattr(user_row, '_mapping') else dict(user_row)
        
        # Verify password
        if not verify_password(request.password, user.get('password_hash', '')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Generate new JWT token
        access_token = create_access_token(
            data={"sub": str(user['id']), "email": user['email']}
        )
        
        # Create or update session
        create_or_update_session(db, user['id'], access_token)
        
        # Update last login if column exists
        users_table = get_users_table(db)
        if 'last_login' in users_table.c:
            db.execute(
                users_table.update().where(users_table.c.id == user['id']).values(last_login=datetime.utcnow())
            )
            db.commit()
        
        # Prepare user data for response
        user_data = {
            "id": str(user['id']),
            "email": user['email'],
            "username": user.get('username'),
            "first_name": user.get('first_name'),
            "last_name": user.get('last_name'),
            "is_active": user.get('is_active', True),
            "is_verified": user.get('is_verified', False),
            "last_login": user.get('last_login').isoformat() if user.get('last_login') else None
        }
        
        return {
            "success": True,
            "message": "Login successful",
            "token": access_token,
            "user_id": str(user['id']),
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )

@router.post("/logout", response_model=dict)
async def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    User logout endpoint
    Invalidates the current session token
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        token = authorization.split("Bearer ")[1]
        
        # Find and delete the session
        sessions_table = get_sessions_table(db)
        result = db.execute(
            sessions_table.delete().where(sessions_table.c.token == token)
        )
        db.commit()
        
        return {
            "success": True,
            "message": "Logout successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during logout: {str(e)}"
        )

@router.get("/verify", response_model=dict)
async def verify_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Verify JWT token and return user information
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        token = authorization.split("Bearer ")[1]
        
        # Decode JWT token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        users_table = get_users_table(db)
        result = db.execute(users_table.select().where(users_table.c.id == uuid.UUID(user_id)))
        user_row = result.first()
        
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Convert row to dict
        user = dict(user_row._mapping) if hasattr(user_row, '_mapping') else dict(user_row)
        
        # Prepare user data
        user_data = {
            "id": str(user['id']),
            "email": user['email'],
            "username": user.get('username'),
            "first_name": user.get('first_name'),
            "last_name": user.get('last_name'),
            "is_active": user.get('is_active', True),
            "is_verified": user.get('is_verified', False)
        }
        
        return {
            "success": True,
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying token: {str(e)}"
        )
