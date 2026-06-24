"""
Infrastructure throttles for API-wide and authentication endpoint limits.
"""

from rest_framework.throttling import SimpleRateThrottle


class AuthenticationEndpointRateThrottle(SimpleRateThrottle):
    """
    Apply an additional IP-based throttle to authentication endpoints.

    This avoids changing authentication views while keeping auth-specific
    throttling in infrastructure configuration.
    """

    scope = 'auth'
    auth_path_prefix = '/api/v1/auth/'

    def get_cache_key(self, request, view):
        if not request.path.startswith(self.auth_path_prefix):
            return None

        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }
