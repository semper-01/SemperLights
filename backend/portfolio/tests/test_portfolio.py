from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from core.test_utils import auth_client, create_category, create_project, create_staff, create_technology, create_user
from portfolio.models import Category, Project, ProjectImage, Technology
from portfolio.serializers import ProjectSerializer
from portfolio.services import (
    PortfolioService,
    PortfolioServiceError,
    ProjectAlreadyDraft,
    ProjectAlreadyPublished,
    ProjectArchivedError,
    ProjectNotPublishedError,
)


class PortfolioModelTests(TestCase):
    def test_category_technology_project_and_image_creation(self):
        category = create_category()
        technology = create_technology()
        project = create_project(category=category)
        project.technologies.add(technology)
        image = ProjectImage.objects.create(project=project, image='projects/images/example.png', caption='Home')

        self.assertEqual(str(category), 'Web Apps')
        self.assertEqual(str(technology), 'Django')
        self.assertEqual(str(project), 'Portfolio Site')
        self.assertEqual(str(image), 'Portfolio Site - Home')
        self.assertEqual(project.technologies.get(), technology)

    def test_unique_category_slug_constraint(self):
        create_category(slug='unique')

        with self.assertRaises(IntegrityError):
            Category.objects.create(name='Another', slug='unique')

    def test_project_status_choices_validate(self):
        project = create_project(status='invalid')

        with self.assertRaises(ValidationError):
            project.full_clean()


class PortfolioServiceTests(TestCase):
    def test_publish_unpublish_and_feature_project(self):
        project = create_project(status=Project.STATUS_DRAFT)

        PortfolioService.publish_project(project)
        project.refresh_from_db()
        self.assertEqual(project.status, Project.STATUS_PUBLISHED)

        PortfolioService.feature_project(project)
        project.refresh_from_db()
        self.assertTrue(project.featured)

        PortfolioService.unpublish_project(project)
        project.refresh_from_db()
        self.assertEqual(project.status, Project.STATUS_DRAFT)
        self.assertFalse(project.featured)

    def test_invalid_project_transitions_raise_domain_errors(self):
        published = create_project()
        draft = create_project(title='Draft', slug='draft', status=Project.STATUS_DRAFT)
        archived = create_project(title='Archived', slug='archived', status=Project.STATUS_ARCHIVED)

        with self.assertRaises(ProjectAlreadyPublished):
            PortfolioService.publish_project(published)
        with self.assertRaises(ProjectAlreadyDraft):
            PortfolioService.unpublish_project(draft)
        with self.assertRaises(ProjectArchivedError):
            PortfolioService.publish_project(archived)
        with self.assertRaises(ProjectNotPublishedError):
            PortfolioService.feature_project(draft)
        published.featured = True
        published.save(update_fields=['featured'])
        with self.assertRaises(PortfolioServiceError):
            PortfolioService.feature_project(published)


class PortfolioSerializerTests(TestCase):
    def test_project_serializer_valid_input_and_read_only_fields(self):
        category = create_category()
        technology = create_technology()
        serializer = ProjectSerializer(
            data={
                'title': 'Serialized Project',
                'slug': 'serialized-project',
                'category': category.id,
                'technologies': [technology.id],
                'status': Project.STATUS_PUBLISHED,
                'created_at': '2000-01-01T00:00:00Z',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        project = serializer.save()
        self.assertNotEqual(str(project.created_at), '2000-01-01 00:00:00+00:00')

    def test_project_serializer_requires_category(self):
        serializer = ProjectSerializer(data={'title': 'Missing Category', 'slug': 'missing-category'})

        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)


class PortfolioAPITests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.staff = create_staff()
        self.category = create_category()
        self.project = create_project(category=self.category)

    def test_anonymous_can_list_published_projects_with_pagination(self):
        response = self.client.get('/api/v1/projects/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_anonymous_cannot_create_project(self):
        response = self.client.post(
            '/api/v1/projects/',
            {'title': 'Blocked', 'slug': 'blocked', 'category': self.category.id},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)

    def test_authenticated_non_staff_cannot_create_project(self):
        client = auth_client(self.user)

        response = client.post(
            '/api/v1/projects/',
            {'title': 'Blocked', 'slug': 'blocked', 'category': self.category.id},
            format='json',
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_can_crud_project_and_publish_action(self):
        client = auth_client(self.staff)
        create = client.post(
            '/api/v1/projects/',
            {
                'title': 'Staff Project',
                'slug': 'staff-project',
                'category': self.category.id,
                'status': Project.STATUS_DRAFT,
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201)

        detail_url = f"/api/v1/projects/{create.data['id']}/"
        update = client.patch(detail_url, {'short_description': 'Updated'}, format='json')
        self.assertEqual(update.status_code, 200)

        publish = client.post(f"{detail_url}publish/", {}, format='json')
        self.assertEqual(publish.status_code, 200)
        self.assertEqual(publish.data['status'], Project.STATUS_PUBLISHED)

        delete = client.delete(detail_url)
        self.assertEqual(delete.status_code, 204)

    def test_invalid_page_request_returns_not_found(self):
        response = self.client.get('/api/v1/projects/?page=999')

        self.assertEqual(response.status_code, 404)
