from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class Form(BaseModel):
    email: Optional[str]
    password: Optional[str]
    confirm_password: Optional[str]

class ResponseModel(BaseModel):
    """Standard API response model"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class BulkResponse(BaseModel):
    """Response model for bulk operations"""
    success: bool
    message: str
    data: List[str]  # List of created record IDs

