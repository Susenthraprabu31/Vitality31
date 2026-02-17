import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, Float, Numeric, ForeignKey, JSON, Enum as SAEnum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime as dt

Base = declarative_base()

# Generated models from schema data
# This file contains all database models that should be importable by api_crud.py

# DefaultModel - Always included as a fallback/example model
class DefaultModel(Base):
    """A simple placeholder/example model"""
    __tablename__ = "default_model"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.utcnow)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

class Formusers_111578632(Base):
    """Table for form component-users-111578632 - User accounts table with authentication and permissions"""
    __tablename__ = "form_users_111578632"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False)
    username = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    first_name = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=func.now())
    is_verified = Column(Boolean, nullable=False, default=False)
    permissions = Column(JSON, nullable=True, default='{}')
    is_superuser = Column(Boolean, nullable=False, default=False)
    password_hash = Column(String, nullable=False)

class Formauth_roles_1958612634(Base):
    """Table for form component-auth-roles-1958612634 - Role definitions for role-based access control"""
    __tablename__ = "form_auth_roles_1958612634"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now())
    description = Column(Text, nullable=True)
    permissions = Column(JSON, nullable=True, default='[]')

class Formuser_roles_1933744457(Base):
    """Table for form component-user-roles-1933744457 - Junction table linking users to roles (many-to-many)"""
    __tablename__ = "form_user_roles_1933744457"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    role_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

class Formauth_sessions_227409580(Base):
    """Table for form component-auth-sessions-227409580 - User session tokens for authentication"""
    __tablename__ = "form_auth_sessions_227409580"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    token = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    expires_at = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    refresh_token = Column(String, nullable=True)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

class Formvitality_form_338226625(Base):
    """Table for form component-vitality-form-338226625 - New table created in table view"""
    __tablename__ = "form_vitality_form_338226625"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    Age = Column(String, nullable=True)
    City = Column(String, nullable=True)
    Name = Column(String, nullable=True)
    Email = Column(String, nullable=True)
    State = Column(String, nullable=True)
    Gender = Column(String, nullable=True)
    Mobile = Column(String, nullable=True)
    Address = Column(String, nullable=True)
    Country = Column(String, nullable=True)
    Pincode = Column(String, nullable=True)
    Occupation = Column(String, nullable=True)
    created_at = Column(DateTime, default=dt.utcnow)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

class Formpassword_reset_tokens_309747282(Base):
    """Table for form component-password-reset-tokens-309747282 - Tokens for password reset functionality"""
    __tablename__ = "form_password_reset_tokens_309747282"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    used = Column(Boolean, nullable=False, default=False)
    token = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    expires_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

class Formemail_verification_tokens_1774230299(Base):
    """Table for form component-email-verification-tokens-1774230299 - Tokens for email verification"""
    __tablename__ = "form_email_verification_tokens_1774230299"
    
    id = Column(UUID(as_uuid=True), nullable=False, primary_key=True, default=uuid.uuid4)
    token = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    expires_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, default=dt.utcnow, onupdate=dt.utcnow)

