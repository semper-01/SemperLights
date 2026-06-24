from typing import Any

from django.db import transaction

from .models import Project


class PortfolioServiceError(Exception):
    """Base exception for PortfolioService operations."""


class ProjectAlreadyPublished(PortfolioServiceError):
    """Raised when publishing a project that is already published."""


class ProjectAlreadyDraft(PortfolioServiceError):
    """Raised when unpublishing a project that is already a draft."""


class ProjectArchivedError(PortfolioServiceError):
    """Raised when an operation is invalid for archived projects."""


class ProjectNotPublishedError(PortfolioServiceError):
    """Raised when a project must be published before featuring."""


class PortfolioService:
    """Encapsulates business operations for portfolio projects."""

    @classmethod
    def publish_project(cls, project: Project) -> Project:
        """Publish a draft project."""
        if project.status == Project.STATUS_PUBLISHED:
            raise ProjectAlreadyPublished('Project is already published.')
        if project.status == Project.STATUS_ARCHIVED:
            raise ProjectArchivedError('Archived projects cannot be republished.')

        project.status = Project.STATUS_PUBLISHED
        project.save(update_fields=['status'])
        return project

    @classmethod
    def unpublish_project(cls, project: Project) -> Project:
        """Return a project to draft status."""
        if project.status == Project.STATUS_DRAFT:
            raise ProjectAlreadyDraft('Project is already a draft.')
        if project.status == Project.STATUS_ARCHIVED:
            raise ProjectArchivedError('Archived projects cannot be unpublished.')

        project.status = Project.STATUS_DRAFT
        project.featured = False
        project.save(update_fields=['status', 'featured'])
        return project

    @classmethod
    def feature_project(cls, project: Project) -> Project:
        """Mark a published project as featured."""
        if project.status != Project.STATUS_PUBLISHED:
            raise ProjectNotPublishedError('Only published projects can be featured.')
        if project.featured:
            raise PortfolioServiceError('Project is already featured.')

        project.featured = True
        project.save(update_fields=['featured'])
        return project
