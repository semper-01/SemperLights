"""
Infrastructure middleware for safe request logging.
"""

import logging
import time


request_logger = logging.getLogger('request')


class RequestLoggingMiddleware:
    """
    Log request metadata without bodies, cookies, tokens, or credentials.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start_time) * 1000

        request_logger.info(
            "method=%s path=%s status_code=%s response_time_ms=%.2f",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )

        return response
