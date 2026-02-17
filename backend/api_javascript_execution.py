"""
JavaScript Code Execution API
FastAPI router for executing JavaScript code in Node.js sandbox.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional

from services.javascript_execution_service import (
    execute_javascript_code,
    check_nodejs_available
)

router = APIRouter(prefix="/api/javascript", tags=["JavaScript Execution"])


class ExecuteJavaScriptRequest(BaseModel):
    """Request model for JavaScript code execution"""
    code: str = Field(..., description="JavaScript code to execute")
    input_data: Any = Field(default=None, description="Input data available as 'input' or 'input_data' variable")
    output_variable: str = Field(default="result", description="Name of the variable to return as result")
    timeout: int = Field(default=30, ge=1, le=60, description="Execution timeout in seconds")


class ExecuteJavaScriptResponse(BaseModel):
    """Response model for JavaScript code execution"""
    status: str
    result: Any = None
    error: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    executionTime: float


@router.post("/execute", response_model=ExecuteJavaScriptResponse)
async def execute_javascript(request: ExecuteJavaScriptRequest):
    """
    Execute JavaScript code in a secure Node.js sandbox.
    
    Security:
    - Runs in isolated Node.js subprocess with VM module
    - Limited to JavaScript standard library
    - No file system access
    - No network access
    - Timeout protection
    
    Usage:
    - Access input data via the 'input' or 'input_data' variable
    - Use 'return' statement or store result in 'result' variable
    - Use console.log() for debugging (captured in stdout)
    """
    if not check_nodejs_available():
        return ExecuteJavaScriptResponse(
            status="error",
            error="Node.js is not available. Please install Node.js.",
            executionTime=0
        )
    
    result = execute_javascript_code(
        code=request.code,
        input_data=request.input_data,
        timeout=request.timeout,
        output_variable=request.output_variable
    )
    
    return ExecuteJavaScriptResponse(**result)


# Create alias router for backward compatibility
alias_router = APIRouter(prefix="/api", tags=["JavaScript Execution"])

@alias_router.post("/execute-javascript", response_model=ExecuteJavaScriptResponse)
async def execute_javascript_alias(request: ExecuteJavaScriptRequest):
    """Alias endpoint for backward compatibility (/api/execute-javascript)"""
    return await execute_javascript(request)


@router.get("/info")
async def javascript_execution_info():
    """
    Get information about JavaScript execution capabilities.
    Returns available features and configuration.
    """
    return {
        "available": check_nodejs_available(),
        "runtime": "Node.js",
        "sandbox": "VM Module",
        "max_timeout": 60,
        "default_timeout": 30,
        "input_variables": ["input", "input_data"],
        "output_variable": "result",
        "available_globals": [
            "JSON", "Math", "Date", "Array", "Object", "String", "Number",
            "Boolean", "RegExp", "Error", "Map", "Set", "console",
            "parseInt", "parseFloat", "isNaN", "isFinite",
            "encodeURI", "decodeURI", "encodeURIComponent", "decodeURIComponent"
        ]
    }


@router.get("/health")
async def javascript_execution_health():
    """Health check for JavaScript execution service"""
    return {
        "status": "healthy" if check_nodejs_available() else "degraded",
        "nodejs": check_nodejs_available()
    }
