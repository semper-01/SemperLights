"""
Standardized API response utilities for consistent response formatting.
"""

from rest_framework.response import Response


class StandardResponse:
    """Helper class for standardized API responses."""

    @staticmethod
    def success(data=None, message="Success", status=200):
        """Return a success response."""
        return Response(
            {
                "success": True,
                "message": message,
                "data": data,
                "errors": None,
            },
            status=status,
        )

    @staticmethod
    def error(errors=None, message="An error occurred", status=400):
        """Return an error response."""
        return Response(
            {
                "success": False,
                "message": message,
                "data": None,
                "errors": errors or {},
            },
            status=status,
        )

    @staticmethod
    def created(data=None, message="Created", status=201):
        """Return a created response."""
        return StandardResponse.success(data=data, message=message, status=status)

    @staticmethod
    def no_content(message="No content", status=204):
        """Return a no content response."""
        return Response(
            {
                "success": True,
                "message": message,
                "data": None,
                "errors": None,
            },
            status=status,
        )
