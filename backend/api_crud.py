from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DisconnectionError
from typing import List, Optional, Annotated, Union
from uuid import UUID
from database.db import get_db
from database.models import Formusers_111578632 as DBFormusers_111578632, Formauth_roles_1958612634 as DBFormauth_roles_1958612634, Formuser_roles_1933744457 as DBFormuser_roles_1933744457, Formauth_sessions_227409580 as DBFormauth_sessions_227409580, Formvitality_form_338226625 as DBFormvitality_form_338226625, Formpassword_reset_tokens_309747282 as DBFormpassword_reset_tokens_309747282, Formemail_verification_tokens_1774230299 as DBFormemail_verification_tokens_1774230299
from models import ResponseModel
from pydantic import BaseModel, Field, ConfigDict, field_serializer
import uuid
import time
from datetime import datetime

# Create API router
router = APIRouter(prefix="/api", tags=["Form APIs"])


# Pydantic model for Formusers_111578632
class Formusers_111578632Base(BaseModel):
    """Base Formusers_111578632 model for create/update operations"""
    email: str
    username: Optional[str] = None
    is_active: bool
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    last_login: Optional[str] = None
    is_verified: bool
    permissions: Optional[dict] = None
    is_superuser: bool
    password_hash: str


class Formusers_111578632(Formusers_111578632Base):
    """Formusers_111578632 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None  # Override base to accept datetime from DB
    
    @field_serializer('last_login')
    def serialize_last_login(self, value: Optional[datetime]) -> Optional[str]:
        """Convert datetime to ISO format string"""
        if value is None:
            return None
        return value.isoformat()
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_users_111578632-1733382622", response_model=List[Formusers_111578632])
def get_all_formusers_111578632(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formusers_111578632 records"""
    items = db.query(DBFormusers_111578632).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_users_111578632-1733382622")
def create_formusers_111578632(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formusers_111578632 records"""
    json_fields_lower = {'permissions'}
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = ['permissions']
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formusers_111578632Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormusers_111578632(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formusers_111578632 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formusers_111578632 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_users_111578632-1733382622/{id}", response_model=Formusers_111578632)
def get_formusers_111578632_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formusers_111578632 record by ID"""
    item = db.query(DBFormusers_111578632).filter(DBFormusers_111578632.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formusers_111578632 not found")
    return item


@router.put("/form/component-generated-form_users_111578632-1733382622/{id}", response_model=ResponseModel)
def update_formusers_111578632(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formusers_111578632 record"""
    json_fields_lower = {'permissions'}
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = ['permissions']
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormusers_111578632).filter(DBFormusers_111578632.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formusers_111578632 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formusers_111578632Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formusers_111578632 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_users_111578632-1733382622/{id}", response_model=ResponseModel)
def delete_formusers_111578632(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formusers_111578632 record"""
    db_item = db.query(DBFormusers_111578632).filter(DBFormusers_111578632.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formusers_111578632 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formusers_111578632 deleted successfully",
        "data": {"id": str(id)}
    }


@router.get("/form/component-generated-form_users_b5cdb404-da06-40eb-b145-39cabac8e81d/{user_id}", response_model=Formusers_111578632)
def get_formusers_111578632_by_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a Formusers_111578632 record by user_id (UUID)"""
    try:
        # Convert user_id string to UUID
        user_uuid = UUID(user_id)
    except ValueError:
        # SECURITY: Use generic error message to prevent information disclosure
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Retry logic for database connection errors
    max_retries = 3
    retry_delay = 0.1  # 100ms delay between retries
    
    for attempt in range(max_retries):
        try:
            # Get user by ID
            user = db.query(DBFormusers_111578632).filter(DBFormusers_111578632.id == user_uuid).first()
            
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
            
            return user
            
        except (OperationalError, DisconnectionError) as e:
            # If this is the last attempt, raise the error
            if attempt == max_retries - 1:
                # Log the error but return a generic message to the client
                print(f"Database connection error after {max_retries} attempts: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Database connection error. Please try again later."
                )
            
            # Rollback the session and wait before retrying
            db.rollback()
            time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            continue
        except HTTPException:
            # Re-raise HTTP exceptions (like 404)
            raise


# Pydantic model for Formauth_roles_1958612634
class Formauth_roles_1958612634Base(BaseModel):
    """Base Formauth_roles_1958612634 model for create/update operations"""
    name: str
    description: Optional[str] = None
    permissions: Optional[dict] = None


class Formauth_roles_1958612634(Formauth_roles_1958612634Base):
    """Formauth_roles_1958612634 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_auth_roles_1958612634-564307625", response_model=List[Formauth_roles_1958612634])
def get_all_formauth_roles_1958612634(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formauth_roles_1958612634 records"""
    items = db.query(DBFormauth_roles_1958612634).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_auth_roles_1958612634-564307625")
def create_formauth_roles_1958612634(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formauth_roles_1958612634 records"""
    json_fields_lower = {'permissions'}
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = ['permissions']
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formauth_roles_1958612634Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormauth_roles_1958612634(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formauth_roles_1958612634 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formauth_roles_1958612634 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_auth_roles_1958612634-564307625/{id}", response_model=Formauth_roles_1958612634)
def get_formauth_roles_1958612634_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formauth_roles_1958612634 record by ID"""
    item = db.query(DBFormauth_roles_1958612634).filter(DBFormauth_roles_1958612634.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formauth_roles_1958612634 not found")
    return item


@router.put("/form/component-generated-form_auth_roles_1958612634-564307625/{id}", response_model=ResponseModel)
def update_formauth_roles_1958612634(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formauth_roles_1958612634 record"""
    json_fields_lower = {'permissions'}
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = ['permissions']
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormauth_roles_1958612634).filter(DBFormauth_roles_1958612634.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formauth_roles_1958612634 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formauth_roles_1958612634Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formauth_roles_1958612634 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_auth_roles_1958612634-564307625/{id}", response_model=ResponseModel)
def delete_formauth_roles_1958612634(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formauth_roles_1958612634 record"""
    db_item = db.query(DBFormauth_roles_1958612634).filter(DBFormauth_roles_1958612634.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formauth_roles_1958612634 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formauth_roles_1958612634 deleted successfully",
        "data": {"id": str(id)}
    }


# Pydantic model for Formuser_roles_1933744457
class Formuser_roles_1933744457Base(BaseModel):
    """Base Formuser_roles_1933744457 model for create/update operations"""
    role_id: UUID
    user_id: UUID


class Formuser_roles_1933744457(Formuser_roles_1933744457Base):
    """Formuser_roles_1933744457 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_user_roles_1933744457-413647234", response_model=List[Formuser_roles_1933744457])
def get_all_formuser_roles_1933744457(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formuser_roles_1933744457 records"""
    items = db.query(DBFormuser_roles_1933744457).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_user_roles_1933744457-413647234")
def create_formuser_roles_1933744457(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formuser_roles_1933744457 records"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formuser_roles_1933744457Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormuser_roles_1933744457(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formuser_roles_1933744457 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formuser_roles_1933744457 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_user_roles_1933744457-413647234/{id}", response_model=Formuser_roles_1933744457)
def get_formuser_roles_1933744457_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formuser_roles_1933744457 record by ID"""
    item = db.query(DBFormuser_roles_1933744457).filter(DBFormuser_roles_1933744457.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formuser_roles_1933744457 not found")
    return item


@router.put("/form/component-generated-form_user_roles_1933744457-413647234/{id}", response_model=ResponseModel)
def update_formuser_roles_1933744457(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formuser_roles_1933744457 record"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormuser_roles_1933744457).filter(DBFormuser_roles_1933744457.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formuser_roles_1933744457 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formuser_roles_1933744457Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formuser_roles_1933744457 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_user_roles_1933744457-413647234/{id}", response_model=ResponseModel)
def delete_formuser_roles_1933744457(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formuser_roles_1933744457 record"""
    db_item = db.query(DBFormuser_roles_1933744457).filter(DBFormuser_roles_1933744457.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formuser_roles_1933744457 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formuser_roles_1933744457 deleted successfully",
        "data": {"id": str(id)}
    }


# Pydantic model for Formauth_sessions_227409580
class Formauth_sessions_227409580Base(BaseModel):
    """Base Formauth_sessions_227409580 model for create/update operations"""
    token: str
    user_id: UUID
    expires_at: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    refresh_token: Optional[str] = None


class Formauth_sessions_227409580(Formauth_sessions_227409580Base):
    """Formauth_sessions_227409580 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None  # Override base to accept datetime from DB
    
    @field_serializer('expires_at')
    def serialize_expires_at(self, value: Optional[datetime]) -> Optional[str]:
        """Convert datetime to ISO format string"""
        if value is None:
            return None
        return value.isoformat()
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_auth_sessions_227409580-661277535", response_model=List[Formauth_sessions_227409580])
def get_all_formauth_sessions_227409580(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formauth_sessions_227409580 records"""
    items = db.query(DBFormauth_sessions_227409580).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_auth_sessions_227409580-661277535")
def create_formauth_sessions_227409580(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formauth_sessions_227409580 records"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formauth_sessions_227409580Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormauth_sessions_227409580(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formauth_sessions_227409580 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formauth_sessions_227409580 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_auth_sessions_227409580-661277535/{id}", response_model=Formauth_sessions_227409580)
def get_formauth_sessions_227409580_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formauth_sessions_227409580 record by ID"""
    item = db.query(DBFormauth_sessions_227409580).filter(DBFormauth_sessions_227409580.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formauth_sessions_227409580 not found")
    return item


@router.put("/form/component-generated-form_auth_sessions_227409580-661277535/{id}", response_model=ResponseModel)
def update_formauth_sessions_227409580(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formauth_sessions_227409580 record"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormauth_sessions_227409580).filter(DBFormauth_sessions_227409580.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formauth_sessions_227409580 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formauth_sessions_227409580Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formauth_sessions_227409580 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_auth_sessions_227409580-661277535/{id}", response_model=ResponseModel)
def delete_formauth_sessions_227409580(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formauth_sessions_227409580 record"""
    db_item = db.query(DBFormauth_sessions_227409580).filter(DBFormauth_sessions_227409580.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formauth_sessions_227409580 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formauth_sessions_227409580 deleted successfully",
        "data": {"id": str(id)}
    }


@router.get("/form/component-generated-form_auth_sessions_b5cdb404-da06-40eb-b145-39cabac8e81d/{user_id}", response_model=List[Formauth_sessions_227409580])
def get_formauth_sessions_227409580_by_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get the most recent Formauth_sessions_227409580 record for a specific user_id (from current login)"""
    try:
        # Convert user_id string to UUID
        user_uuid = UUID(user_id)
    except ValueError:
        # SECURITY: Use generic error message to prevent information disclosure
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Retry logic for database connection errors
    max_retries = 3
    retry_delay = 0.1  # 100ms delay between retries
    
    for attempt in range(max_retries):
        try:
            # Get the most recent session (ordered by created_at DESC, limit 1)
            # This returns only the session from the current login, not all historical sessions
            most_recent_session = db.query(DBFormauth_sessions_227409580)\
                .filter(DBFormauth_sessions_227409580.user_id == user_uuid)\
                .order_by(DBFormauth_sessions_227409580.created_at.desc())\
                .first()
            
            # Return as list (single item) to match response_model, or empty list if no session found
            if most_recent_session:
                return [most_recent_session]
            return []
            
        except (OperationalError, DisconnectionError) as e:
            # If this is the last attempt, raise the error
            if attempt == max_retries - 1:
                # Log the error but return a generic message to the client
                print(f"Database connection error after {max_retries} attempts: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Database connection error. Please try again later."
                )
            
            # Rollback the session and wait before retrying
            db.rollback()
            time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            continue
        except HTTPException:
            # Re-raise HTTP exceptions (like 404)
            raise


# Pydantic model for Formvitality_form_338226625
class Formvitality_form_338226625Base(BaseModel):
    """Base Formvitality_form_338226625 model for create/update operations"""
    Age: Optional[str] = None
    City: Optional[str] = None
    Name: Optional[str] = None
    Email: Optional[str] = None
    State: Optional[str] = None
    Gender: Optional[str] = None
    Mobile: Optional[str] = None
    Address: Optional[str] = None
    Country: Optional[str] = None
    Pincode: Optional[str] = None
    Occupation: Optional[str] = None


class Formvitality_form_338226625(Formvitality_form_338226625Base):
    """Formvitality_form_338226625 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_vitality_form_338226625-917682082", response_model=List[Formvitality_form_338226625])
def get_all_formvitality_form_338226625(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formvitality_form_338226625 records"""
    items = db.query(DBFormvitality_form_338226625).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_vitality_form_338226625-917682082")
def create_formvitality_form_338226625(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formvitality_form_338226625 records"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formvitality_form_338226625Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormvitality_form_338226625(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formvitality_form_338226625 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formvitality_form_338226625 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_vitality_form_338226625-917682082/{id}", response_model=Formvitality_form_338226625)
def get_formvitality_form_338226625_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formvitality_form_338226625 record by ID"""
    item = db.query(DBFormvitality_form_338226625).filter(DBFormvitality_form_338226625.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formvitality_form_338226625 not found")
    return item


@router.put("/form/component-generated-form_vitality_form_338226625-917682082/{id}", response_model=ResponseModel)
def update_formvitality_form_338226625(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formvitality_form_338226625 record"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormvitality_form_338226625).filter(DBFormvitality_form_338226625.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formvitality_form_338226625 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formvitality_form_338226625Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formvitality_form_338226625 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_vitality_form_338226625-917682082/{id}", response_model=ResponseModel)
def delete_formvitality_form_338226625(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formvitality_form_338226625 record"""
    db_item = db.query(DBFormvitality_form_338226625).filter(DBFormvitality_form_338226625.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formvitality_form_338226625 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formvitality_form_338226625 deleted successfully",
        "data": {"id": str(id)}
    }


# Pydantic model for Formpassword_reset_tokens_309747282
class Formpassword_reset_tokens_309747282Base(BaseModel):
    """Base Formpassword_reset_tokens_309747282 model for create/update operations"""
    used: bool
    token: str
    user_id: UUID
    expires_at: str


class Formpassword_reset_tokens_309747282(Formpassword_reset_tokens_309747282Base):
    """Formpassword_reset_tokens_309747282 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    expires_at: datetime  # Override base to accept datetime from DB
    
    @field_serializer('expires_at')
    def serialize_expires_at(self, value: datetime) -> str:
        """Convert datetime to ISO format string"""
        return value.isoformat()
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_password_reset_tokens_309747282-1902728994", response_model=List[Formpassword_reset_tokens_309747282])
def get_all_formpassword_reset_tokens_309747282(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formpassword_reset_tokens_309747282 records"""
    items = db.query(DBFormpassword_reset_tokens_309747282).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_password_reset_tokens_309747282-1902728994")
def create_formpassword_reset_tokens_309747282(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formpassword_reset_tokens_309747282 records"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formpassword_reset_tokens_309747282Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormpassword_reset_tokens_309747282(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formpassword_reset_tokens_309747282 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formpassword_reset_tokens_309747282 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_password_reset_tokens_309747282-1902728994/{id}", response_model=Formpassword_reset_tokens_309747282)
def get_formpassword_reset_tokens_309747282_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formpassword_reset_tokens_309747282 record by ID"""
    item = db.query(DBFormpassword_reset_tokens_309747282).filter(DBFormpassword_reset_tokens_309747282.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formpassword_reset_tokens_309747282 not found")
    return item


@router.put("/form/component-generated-form_password_reset_tokens_309747282-1902728994/{id}", response_model=ResponseModel)
def update_formpassword_reset_tokens_309747282(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formpassword_reset_tokens_309747282 record"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormpassword_reset_tokens_309747282).filter(DBFormpassword_reset_tokens_309747282.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formpassword_reset_tokens_309747282 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formpassword_reset_tokens_309747282Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formpassword_reset_tokens_309747282 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_password_reset_tokens_309747282-1902728994/{id}", response_model=ResponseModel)
def delete_formpassword_reset_tokens_309747282(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formpassword_reset_tokens_309747282 record"""
    db_item = db.query(DBFormpassword_reset_tokens_309747282).filter(DBFormpassword_reset_tokens_309747282.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formpassword_reset_tokens_309747282 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formpassword_reset_tokens_309747282 deleted successfully",
        "data": {"id": str(id)}
    }


@router.get("/form/component-generated-form_auth_sessions_b5cdb404-da06-40eb-b145-39cabac8e81d/{user_id}", response_model=List[Formpassword_reset_tokens_309747282])
def get_formpassword_reset_tokens_309747282_by_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get the most recent Formpassword_reset_tokens_309747282 record for a specific user_id (from current login)"""
    try:
        # Convert user_id string to UUID
        user_uuid = UUID(user_id)
    except ValueError:
        # SECURITY: Use generic error message to prevent information disclosure
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Retry logic for database connection errors
    max_retries = 3
    retry_delay = 0.1  # 100ms delay between retries
    
    for attempt in range(max_retries):
        try:
            # Get the most recent session (ordered by created_at DESC, limit 1)
            # This returns only the session from the current login, not all historical sessions
            most_recent_session = db.query(DBFormpassword_reset_tokens_309747282)\
                .filter(DBFormpassword_reset_tokens_309747282.user_id == user_uuid)\
                .order_by(DBFormpassword_reset_tokens_309747282.created_at.desc())\
                .first()
            
            # Return as list (single item) to match response_model, or empty list if no session found
            if most_recent_session:
                return [most_recent_session]
            return []
            
        except (OperationalError, DisconnectionError) as e:
            # If this is the last attempt, raise the error
            if attempt == max_retries - 1:
                # Log the error but return a generic message to the client
                print(f"Database connection error after {max_retries} attempts: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Database connection error. Please try again later."
                )
            
            # Rollback the session and wait before retrying
            db.rollback()
            time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            continue
        except HTTPException:
            # Re-raise HTTP exceptions (like 404)
            raise


# Pydantic model for Formemail_verification_tokens_1774230299
class Formemail_verification_tokens_1774230299Base(BaseModel):
    """Base Formemail_verification_tokens_1774230299 model for create/update operations"""
    token: str
    user_id: UUID
    verified: bool
    expires_at: str


class Formemail_verification_tokens_1774230299(Formemail_verification_tokens_1774230299Base):
    """Formemail_verification_tokens_1774230299 model with all fields including database fields"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    expires_at: datetime  # Override base to accept datetime from DB
    
    @field_serializer('expires_at')
    def serialize_expires_at(self, value: datetime) -> str:
        """Convert datetime to ISO format string"""
        return value.isoformat()
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


@router.get("/form/component-generated-form_email_verification_tokens_1774230299-1362565659", response_model=List[Formemail_verification_tokens_1774230299])
def get_all_formemail_verification_tokens_1774230299(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all Formemail_verification_tokens_1774230299 records"""
    items = db.query(DBFormemail_verification_tokens_1774230299).offset(skip).limit(limit).all()
    return items


@router.post("/form/component-generated-form_email_verification_tokens_1774230299-1362565659")
def create_formemail_verification_tokens_1774230299(
    raw_data: Union[dict, List[dict]],
    db: Session = Depends(get_db)
):
    """Create one or multiple Formemail_verification_tokens_1774230299 records"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    # Check if data is a list (bulk) or single item
    is_bulk = isinstance(raw_data, list)
    items_to_process = raw_data if is_bulk else [raw_data]
    
    db_items = []
    new_ids = []
    
    # Process all items
    for raw_item in items_to_process:
        # Flatten nested objects
        flattened_item = flatten_nested_objects(raw_item)
        
        # Parse date/datetime strings before validation
        parsed_item = parse_datetime_fields(flattened_item)
        # Normalize JSON string fields (e.g., meta)
        parsed_item = normalize_json_fields(parsed_item)
        
        # Convert empty strings to None for numeric/optional fields
        for key, value in list(parsed_item.items()):
            if value == "" or (isinstance(value, str) and value.strip() == ""):
                parsed_item[key] = None
        
        
        
        # Validate and create Pydantic model
        try:
            validated_item = Formemail_verification_tokens_1774230299Base(**parsed_item)
            # Exclude None values so omitted fields (like auto-increment columns) are not sent
            # and the database can apply server-side defaults/auto-increment.
            payload = validated_item.model_dump(exclude_none=True)
            db_item = DBFormemail_verification_tokens_1774230299(**payload, id=uuid.uuid4())
            db.add(db_item)
            db_items.append(db_item)
        except Exception as e:
            # Log the error but continue processing other items
            print(f"Error processing item {raw_item}: {e}")
            continue
    
    if not db_items:
        raise HTTPException(status_code=400, detail="No valid items to process")
    
    db.commit()
    
    # Refresh all items and collect IDs
    for db_item in db_items:
        db.refresh(db_item)
        new_ids.append(str(db_item.id))
    
    # Return appropriate response based on input type
    if is_bulk:
        return {
            "success": True,
            "message": f"{len(new_ids)} Formemail_verification_tokens_1774230299 records created successfully",
            "data": new_ids  # List of IDs for bulk
        }
    else:
        return {
            "success": True,
            "message": "Formemail_verification_tokens_1774230299 created successfully",
            "data": {"id": new_ids[0]}  # Single ID object for single record
        }


@router.get("/form/component-generated-form_email_verification_tokens_1774230299-1362565659/{id}", response_model=Formemail_verification_tokens_1774230299)
def get_formemail_verification_tokens_1774230299_by_id(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific Formemail_verification_tokens_1774230299 record by ID"""
    item = db.query(DBFormemail_verification_tokens_1774230299).filter(DBFormemail_verification_tokens_1774230299.id == id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Formemail_verification_tokens_1774230299 not found")
    return item


@router.put("/form/component-generated-form_email_verification_tokens_1774230299-1362565659/{id}", response_model=ResponseModel)
def update_formemail_verification_tokens_1774230299(
    id: UUID,
    raw_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing Formemail_verification_tokens_1774230299 record"""
    json_fields_lower = set()
    
    def parse_datetime_fields(data):
        """Parse string date/datetime values to datetime objects"""
        if not isinstance(data, dict):
            return data
        
        parsed_data = data.copy()
        
        # Dynamically detected datetime fields based on database schema
        datetime_fields = []
        time_only_fields = []
        
        # Dynamically detected JSON fields (preserve nested objects)
        json_fields = []
        
        for key, value in parsed_data.items():
            key_lower = key.lower()
            
            # CRITICAL: Skip createdat and updatedat - they should remain as ISO strings
            # These fields are defined as String in the Pydantic model, not datetime
            # This prevents validation errors when Bolna AI or other integrations send ISO strings
            if key_lower in ['createdat', 'updatedat', 'created_at', 'updated_at']:
                continue
            
            # Check if field is a datetime field based on database schema
            is_datetime_field = key_lower in datetime_fields
            is_time_only_field = key_lower in time_only_fields
            
            # Fallback pattern matching if not in schema-based detection
            if not is_datetime_field and not is_time_only_field:
                is_datetime_field = (
                    key_lower.endswith('_date') or
                    key_lower.endswith('_datetime') or
                    'date' in key_lower or
                    'datetime' in key_lower or
                    'year' in key_lower or
                    'month' in key_lower
                )
                is_time_only_field = (
                    key_lower.endswith('_time') or
                    (key_lower == 'time' and 'datetime' not in key_lower)
                )
            
            if is_time_only_field:
                # Keep time-only fields as strings
                continue
            elif is_datetime_field and value and isinstance(value, str) and value.strip():
                try:
                    from dateutil import parser
                    # Handle various date formats
                    if key_lower in ['year'] or key_lower.endswith('_year'):
                        # Convert year to a date (first day of the year)
                        if value.isdigit():
                            parsed_data[key] = datetime(int(value), 1, 1)
                    elif key_lower in ['month'] or key_lower.endswith('_month'):
                        # Convert month to a date (first day of the month in current year)
                        if value.isdigit():
                            current_year = datetime.now().year
                            parsed_data[key] = datetime(current_year, int(value), 1)
                    else:
                        # Parse other date/datetime strings
                        parsed_data[key] = parser.parse(value)
                        
                except Exception as e:
                    print(f"Failed to parse datetime field {key}={value}: {e}")
                    # Keep original value if parsing fails
                    continue
            elif is_datetime_field and (not value or (isinstance(value, str) and not value.strip())):
                # Set empty datetime fields to None
                parsed_data[key] = None
        
        return parsed_data
    
    def normalize_json_fields(data):
        """Convert JSON string fields into Python objects when appropriate."""
        if not isinstance(data, dict):
            return data
        normalized = data.copy()
        for key, value in normalized.items():
            key_lower = key.lower()
            if key_lower in json_fields_lower and isinstance(value, str) and value.strip():
                try:
                    import json
                    parsed = json.loads(value)
                    if isinstance(parsed, (dict, list)):
                        normalized[key] = parsed
                except Exception:
                    # Leave as-is if not valid JSON
                    pass
        return normalized
    
    def flatten_nested_objects(data):
        """Flatten nested objects for database compatibility"""
        if not isinstance(data, dict):
            return data
        
        flattened = {}
        
        def flatten(obj, prefix='', depth=0):
            if depth > 20:  # Prevent infinite recursion
                return
            
            for key, value in obj.items():
                key_lower = key.lower()
                # Preserve JSON fields as-is (keep nested objects)
                if key_lower in json_fields_lower and prefix == '':
                    flattened[key] = value
                    continue
                
                # Preserve vector_embedding as-is (it's a list of floats, not a nested object)
                if key_lower == 'vector_embedding' and prefix == '':
                    flattened[key] = value
                    continue

                full_path = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, list):
                    # Handle arrays
                    has_objects = any(isinstance(item, dict) for item in value)
                    if has_objects:
                        for i, item in enumerate(value):
                            if isinstance(item, dict):
                                flatten(item, f"{full_path}[{i}]", depth + 1)
                            else:
                                leaf_field = full_path.split('.')[-1]
                                flattened[f"{leaf_field}_{i}"] = item
                    else:
                        leaf_field = full_path.split('.')[-1]
                        flattened[leaf_field] = ', '.join(map(str, value)) if value else None
                        
                elif isinstance(value, dict):
                    # Recursively flatten nested objects
                    flatten(value, full_path, depth + 1)
                    
                else:
                    # For leaf values, use the leaf field name
                    parts = full_path.split('.')
                    leaf_field = parts[-1]
                    flattened[leaf_field] = value
        
        flatten(data)
        
        # Also preserve original top-level fields
        for key, value in data.items():
            if not isinstance(value, (dict, list)) and key not in flattened:
                flattened[key] = value
        
        return flattened
    
    db_item = db.query(DBFormemail_verification_tokens_1774230299).filter(DBFormemail_verification_tokens_1774230299.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formemail_verification_tokens_1774230299 not found")
    
    # Flatten nested objects
    flattened_data = flatten_nested_objects(raw_data)
    
    # Parse date/datetime strings before validation
    parsed_data = parse_datetime_fields(flattened_data)
    # Normalize JSON string fields (e.g., meta)
    parsed_data = normalize_json_fields(parsed_data)
    
    # Convert empty strings to None for numeric/optional fields
    for key, value in list(parsed_data.items()):
        if value == "" or (isinstance(value, str) and value.strip() == ""):
            parsed_data[key] = None
    
    
    
    # Validate and update fields
    try:
        validated_item = Formemail_verification_tokens_1774230299Base(**parsed_data)
        for key, value in validated_item.model_dump(exclude_unset=True).items():
            setattr(db_item, key, value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
        
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return {
        "success": True,
        "message": "Formemail_verification_tokens_1774230299 updated successfully",
        "data": {"id": str(db_item.id)}
    }


@router.delete("/form/component-generated-form_email_verification_tokens_1774230299-1362565659/{id}", response_model=ResponseModel)
def delete_formemail_verification_tokens_1774230299(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a Formemail_verification_tokens_1774230299 record"""
    db_item = db.query(DBFormemail_verification_tokens_1774230299).filter(DBFormemail_verification_tokens_1774230299.id == id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Formemail_verification_tokens_1774230299 not found")
        
    db.delete(db_item)
    db.commit()
    return {
        "success": True,
        "message": "Formemail_verification_tokens_1774230299 deleted successfully",
        "data": {"id": str(id)}
    }


@router.get("/form/component-generated-form_auth_sessions_b5cdb404-da06-40eb-b145-39cabac8e81d/{user_id}", response_model=List[Formemail_verification_tokens_1774230299])
def get_formemail_verification_tokens_1774230299_by_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get the most recent Formemail_verification_tokens_1774230299 record for a specific user_id (from current login)"""
    try:
        # Convert user_id string to UUID
        user_uuid = UUID(user_id)
    except ValueError:
        # SECURITY: Use generic error message to prevent information disclosure
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Retry logic for database connection errors
    max_retries = 3
    retry_delay = 0.1  # 100ms delay between retries
    
    for attempt in range(max_retries):
        try:
            # Get the most recent session (ordered by created_at DESC, limit 1)
            # This returns only the session from the current login, not all historical sessions
            most_recent_session = db.query(DBFormemail_verification_tokens_1774230299)\
                .filter(DBFormemail_verification_tokens_1774230299.user_id == user_uuid)\
                .order_by(DBFormemail_verification_tokens_1774230299.created_at.desc())\
                .first()
            
            # Return as list (single item) to match response_model, or empty list if no session found
            if most_recent_session:
                return [most_recent_session]
            return []
            
        except (OperationalError, DisconnectionError) as e:
            # If this is the last attempt, raise the error
            if attempt == max_retries - 1:
                # Log the error but return a generic message to the client
                print(f"Database connection error after {max_retries} attempts: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Database connection error. Please try again later."
                )
            
            # Rollback the session and wait before retrying
            db.rollback()
            time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            continue
        except HTTPException:
            # Re-raise HTTP exceptions (like 404)
            raise

