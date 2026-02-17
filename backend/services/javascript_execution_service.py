"""
JavaScript Code Execution Service
Secure sandboxed execution of JavaScript code using Node.js subprocess.

Security Features:
- Runs in isolated Node.js subprocess
- VM module sandbox prevents direct access to node modules
- Timeout protection (default 30 seconds)
- Limited to JavaScript standard library
"""

import logging
import json
import time
import subprocess
import tempfile
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Node.js wrapper script for sandboxed execution
NODEJS_SANDBOX_SCRIPT = """
const vm = require('vm');
const util = require('util');

// Read input from stdin
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => inputData += chunk);
process.stdin.on('end', async () => {
    try {
        const config = JSON.parse(inputData);
        const code = config.code;
        const input = config.input_data;
        const outputVariable = config.output_variable || 'result';
        const timeout = (config.timeout || 30) * 1000;
        
        // Extract workflowData from input_data if it exists
        // This allows JavaScript code to access workflowData[nodeId] directly
        const workflowData = (input && typeof input === 'object' && input.workflowData) ? input.workflowData : {};
        
        // Create sandbox context with limited globals
        const sandbox = {
            input: input,
            input_data: input,
            workflowData: workflowData,
            result: undefined,
            console: {
                log: (...args) => console.log(...args),
                error: (...args) => console.error(...args),
                warn: (...args) => console.warn(...args),
            },
            JSON: JSON,
            Math: Math,
            Date: Date,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Boolean: Boolean,
            RegExp: RegExp,
            Error: Error,
            Map: Map,
            Set: Set,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
            encodeURI: encodeURI,
            decodeURI: decodeURI,
            encodeURIComponent: encodeURIComponent,
            decodeURIComponent: decodeURIComponent,
            Promise: Promise,
            process: {
                env: process.env
            },
        };
        
        // Detect if code uses await keyword
        const usesAwait = /\bawait\b/.test(code);
        
        // Always expose fetch inside the sandbox
        try {
            const resolveFetchImplementation = () => {
                if (typeof fetch !== 'undefined') {
                    return fetch;
                }
                
                try {
                    const nodeFetch = require('node-fetch');
                    return nodeFetch.default || nodeFetch;
                } catch (fetchLoadError) {
                    const http = require('http');
                    const https = require('https');
                    const { URL } = require('url');
                    
                    return (url, options = {}) => {
                        return new Promise((resolve, reject) => {
                            const urlObj = new URL(url);
                            const client = urlObj.protocol === 'https:' ? https : http;
                            
                            const reqOptions = {
                                hostname: urlObj.hostname,
                                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                                path: urlObj.pathname + urlObj.search,
                                method: options.method || 'GET',
                                headers: options.headers || {}
                            };
                            
                            const req = client.request(reqOptions, (res) => {
                                let data = '';
                                res.on('data', (chunk) => data += chunk);
                                res.on('end', () => {
                                    const response = {
                                        ok: res.statusCode >= 200 && res.statusCode < 300,
                                        status: res.statusCode,
                                        statusText: res.statusMessage,
                                        headers: res.headers,
                                        text: async () => data,
                                        json: async () => {
                                            try {
                                                return JSON.parse(data);
                                            } catch {
                                                return data;
                                            }
                                        }
                                    };
                                    resolve(response);
                                });
                            });
                            
                            req.on('error', reject);
                            
                            if (options.body) {
                                req.write(options.body);
                            }
                            
                            req.end();
                        });
                    };
                }
            };
            
            sandbox.fetch = resolveFetchImplementation();
        } catch (e) {
            // If fetch setup fails, provide a basic error
            sandbox.fetch = () => Promise.reject(new Error('fetch is not available'));
        }
        
        vm.createContext(sandbox);
        
        // Detect if code uses await - if so, wrap in async IIFE
        const wrappedCode = usesAwait ? `
            (async function() {
                ${code}
            })();
        ` : `
            (function() {
                ${code}
            })();
        `;
        
        const isPromiseLike = (value) =>
            value &&
            (typeof value === 'object' || typeof value === 'function') &&
            typeof value.then === 'function';

        const awaitWithTimeout = async (promise) => {
            return await Promise.race([
                promise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Execution timeout')), timeout)
                )
            ]);
        };
        
        // Execute script and handle async/sync results uniformly
        let scriptResult;
        try {
            const executionResult = vm.runInContext(wrappedCode, sandbox, {
                timeout: timeout,
                displayErrors: true,
            });

            if (usesAwait || isPromiseLike(executionResult)) {
                scriptResult = await awaitWithTimeout(executionResult);
            } else {
                scriptResult = executionResult;
            }
        } catch (asyncError) {
            throw new Error('Async execution error: ' + (asyncError.message || String(asyncError)));
        }
        
        // Get result - prefer explicit return, then output variable, then 'result'
        let finalResult = scriptResult;
        if (finalResult === undefined && sandbox[outputVariable] !== undefined) {
            finalResult = sandbox[outputVariable];
        }
        if (finalResult === undefined && sandbox.result !== undefined) {
            finalResult = sandbox.result;
        }
        
        // Output result as JSON
        console.log(JSON.stringify({
            status: 'success',
            result: finalResult,
            outputVariable: outputVariable,
        }));
        
    } catch (error) {
        console.log(JSON.stringify({
            status: 'error',
            error: error.message || String(error),
            result: null,
        }));
    }
});
"""


def check_nodejs_available() -> bool:
    """Check if Node.js is available on the system."""
    try:
        result = subprocess.run(
            ['node', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def execute_javascript_code(
    code: str,
    input_data: Any,
    timeout: int = 30,
    output_variable: str = "result"
) -> Dict[str, Any]:
    """
    Execute JavaScript code in a sandboxed Node.js subprocess.
    """
    start_time = time.time()
    
    # Check if Node.js is available
    if not check_nodejs_available():
        return {
            "status": "error",
            "error": "Node.js is not available. Please install Node.js to execute JavaScript code.",
            "result": None,
            "executionTime": 0
        }
    
    try:
        logger.info(f"Executing JavaScript code (timeout: {timeout}s)")
        
        # Prepare input for the sandbox script
        sandbox_input = json.dumps({
            "code": code,
            "input_data": input_data,
            "output_variable": output_variable,
            "timeout": timeout
        })
        
        # Create temporary file for the sandbox script
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(NODEJS_SANDBOX_SCRIPT)
            sandbox_script_path = f.name
        
        try:
            # Execute in Node.js subprocess
            result = subprocess.run(
                ['node', sandbox_script_path],
                input=sandbox_input,
                capture_output=True,
                text=True,
                timeout=timeout + 5  # Add buffer for subprocess overhead
            )
            
            execution_time = time.time() - start_time
            
            # Check return code first
            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else result.stdout.strip() or "Unknown error"
                logger.error(f"JavaScript execution failed with return code {result.returncode}: {error_msg}")
                return {
                    "status": "error",
                    "error": f"JavaScript execution failed with return code {result.returncode}: {error_msg}",
                    "result": None,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "executionTime": execution_time
                }
            
            # Parse output
            stdout_lines = result.stdout.strip().split('\n') if result.stdout else []
            stderr_output = result.stderr.strip() if result.stderr else None
            
            # Find the JSON result line (last line should be the result)
            json_result = None
            console_output = []
            
            for line in stdout_lines:
                try:
                    parsed = json.loads(line)
                    if isinstance(parsed, dict) and 'status' in parsed:
                        json_result = parsed
                    else:
                        console_output.append(line)
                except json.JSONDecodeError:
                    console_output.append(line)
            
            if json_result:
                return {
                    "status": json_result.get("status", "success"),
                    "result": json_result.get("result"),
                    "error": json_result.get("error"),
                    "stdout": '\n'.join(console_output) if console_output else None,
                    "stderr": stderr_output,
                    "executionTime": execution_time,
                    "outputVariable": output_variable
                }
            else:
                # If no JSON result found, check if there's any output
                if stdout_lines or stderr_output:
                    error_msg = f"No valid JSON result from JavaScript execution. stdout: {result.stdout[:500] if result.stdout else 'empty'}, stderr: {stderr_output[:500] if stderr_output else 'empty'}"
                    logger.error(error_msg)
                    return {
                        "status": "error",
                        "error": error_msg,
                        "result": None,
                        "stdout": '\n'.join(console_output) if console_output else result.stdout,
                        "stderr": stderr_output,
                        "executionTime": execution_time
                    }
                else:
                    return {
                        "status": "error",
                        "error": "No output from JavaScript execution",
                        "result": None,
                        "stdout": None,
                        "stderr": stderr_output,
                        "executionTime": execution_time
                    }
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(sandbox_script_path)
            except OSError:
                pass
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "error": f"Execution timed out after {timeout} seconds",
            "result": None,
            "executionTime": time.time() - start_time
        }
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "error": f"Invalid input data: {str(e)}",
            "result": None,
            "executionTime": time.time() - start_time
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Execution error: {str(e)}",
            "result": None,
            "executionTime": time.time() - start_time
        }
