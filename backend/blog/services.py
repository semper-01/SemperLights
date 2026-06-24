from django.db import transaction
from django.utils import timezone

from .models import BlogPost


class BlogServiceError(Exception):
    """Base exception for blog business operations."""


class PostAlreadyPublished(BlogServiceError):
    """Raised when publishing an already published post."""


class PostAlreadyDraft(BlogServiceError):
    """Raised when unpublishing an already draft post."""


class PostAlreadyArchived(BlogServiceError):
    """Raised when archiving a post that is already archived."""


class BlogService:
    """Encapsulates business operations for blog post lifecycle management."""

    @classmethod
    def publish_post(cls, post: BlogPost) -> BlogPost:
        """Publish a draft blog post."""
        if post.status == BlogPost.STATUS_PUBLISHED:
            raise PostAlreadyPublished('Blog post is already published.')

        if not post.content.strip():
            raise BlogServiceError('Cannot publish a blog post without content.')

        post.status = BlogPost.STATUS_PUBLISHED
        if post.published_at is None:
            post.published_at = timezone.now()
        post.save(update_fields=['status', 'published_at'])
        return post

    @classmethod
    def unpublish_post(cls, post: BlogPost) -> BlogPost:
        """Revert a published post to draft."""
        if post.status == BlogPost.STATUS_DRAFT:
            raise PostAlreadyDraft('Blog post is already a draft.')

        post.status = BlogPost.STATUS_DRAFT
        post.save(update_fields=['status'])
        return post

    @classmethod
    def archive_post(cls, post: BlogPost) -> BlogPost:
        """Archive a blog post.

        The current domain model does not include a persistent archive state,
        so archiving is represented by returning the post to draft status.
        """
        if post.status == BlogPost.STATUS_DRAFT:
            raise PostAlreadyArchived('Blog post is already archived/draft.')

        post.status = BlogPost.STATUS_DRAFT
        post.save(update_fields=['status'])
        return post
