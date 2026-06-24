"""
Centralized exception handler for DRF.

Standardizes error responses across the entire API.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """
    Centralized exception handler for DRF.

    Returns consistent JSON response structure for all API errors.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        # DRF has already handled the exception
        error_response = {
            "success": False,
            "message": "An error occurred",
            "data": None,
            "errors": response.data if isinstance(response.data, dict) else {"detail": str(response.data)},
        }

        # Determine status code and message
        if isinstance(exc, ValidationError):
            error_response["message"] = "Validation error"
        elif isinstance(exc, AuthenticationFailed):
            error_response["message"] = "Authentication failed"
        elif isinstance(exc, NotAuthenticated):
            error_response["message"] = "Not authenticated"
        elif isinstance(exc, PermissionDenied):
            error_response["message"] = "Permission denied"
        elif isinstance(exc, MethodNotAllowed):
            error_response["message"] = "Method not allowed"
        elif isinstance(exc, Http404):
            error_response["message"] = "Resource not found"
        else:
            error_response["message"] = str(getattr(exc, "detail", "An error occurred"))

        response.data = error_response
        return response

    # Handle unexpected exceptions
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "Internal server error"

    if isinstance(exc, Http404):
        status_code = status.HTTP_404_NOT_FOUND
        message = "Resource not found"
    elif isinstance(exc, PermissionDenied):
        status_code = status.HTTP_403_FORBIDDEN
        message = "Permission denied"
    elif isinstance(exc, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
        message = "Validation error"
    elif isinstance(exc, (ObjectDoesNotExist, Http404)):
        status_code = status.HTTP_404_NOT_FOUND
        message = "Resource not found"

    error_response = {
        "success": False,
        "message": message,
        "data": None,
        "errors": {"detail": str(exc)},
    }

    return Response(error_response, status=status_code)
