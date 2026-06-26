from django.test import TestCase

from blog.models import BlogCategory, BlogPost
from blog.serializers import BlogPostSerializer
from blog.services import BlogService, BlogServiceError, PostAlreadyArchived, PostAlreadyDraft, PostAlreadyPublished
from core.test_utils import auth_client, create_blog_category, create_blog_post, create_staff, create_user


class BlogModelTests(TestCase):
    def test_blog_category_and_post_string_representations(self):
        category = create_blog_category()
        post = create_blog_post(category=category)

        self.assertEqual(str(category), 'News')
        self.assertEqual(str(post), 'Launch Notes')
        self.assertEqual(post.category, category)


class BlogServiceTests(TestCase):
    def test_publish_unpublish_and_archive_post(self):
        post = create_blog_post(status=BlogPost.STATUS_DRAFT, published_at=None)

        BlogService.publish_post(post)
        post.refresh_from_db()
        self.assertEqual(post.status, BlogPost.STATUS_PUBLISHED)
        self.assertIsNotNone(post.published_at)

        BlogService.unpublish_post(post)
        post.refresh_from_db()
        self.assertEqual(post.status, BlogPost.STATUS_DRAFT)

    def test_invalid_post_transitions_raise(self):
        published = create_blog_post()
        draft = create_blog_post(title='Draft Post', slug='draft-post', status=BlogPost.STATUS_DRAFT)
        empty = create_blog_post(title='Empty', slug='empty', status=BlogPost.STATUS_DRAFT, content='')

        with self.assertRaises(PostAlreadyPublished):
            BlogService.publish_post(published)
        with self.assertRaises(PostAlreadyDraft):
            BlogService.unpublish_post(draft)
        with self.assertRaises(PostAlreadyArchived):
            BlogService.archive_post(draft)
        with self.assertRaises(BlogServiceError):
            BlogService.publish_post(empty)


class BlogSerializerTests(TestCase):
    def test_blog_post_serializer_validates_required_relationships(self):
        user = create_user()
        category = create_blog_category()
        serializer = BlogPostSerializer(
            data={
                'title': 'Serialized Blog',
                'slug': 'serialized-blog',
                'content': 'Content',
                'author': user.id,
                'category': category.id,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_blog_post_serializer_requires_author_and_category(self):
        serializer = BlogPostSerializer(data={'title': 'Missing', 'slug': 'missing'})

        self.assertFalse(serializer.is_valid())
        self.assertIn('author', serializer.errors)
        self.assertIn('category', serializer.errors)


class BlogAPITests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.staff = create_staff()
        self.category = create_blog_category()
        self.post = create_blog_post(category=self.category, author=self.staff)

    def test_public_can_list_published_posts(self):
        response = self.client.get('/api/v1/posts/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_non_staff_cannot_create_post(self):
        response = auth_client(self.user).post(
            '/api/v1/posts/',
            {
                'title': 'Blocked',
                'slug': 'blocked',
                'author': self.user.id,
                'category': self.category.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_can_crud_and_archive_post(self):
        client = auth_client(self.staff)
        create = client.post(
            '/api/v1/posts/',
            {
                'title': 'Staff Blog',
                'slug': 'staff-blog',
                'content': 'Content',
                'author': self.staff.id,
                'category': self.category.id,
                'status': BlogPost.STATUS_PUBLISHED,
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201)

        detail = f"/api/v1/posts/{create.data['id']}/"
        archive = client.post(f'{detail}archive/', {}, format='json')
        self.assertEqual(archive.status_code, 200)
        self.assertEqual(archive.data['status'], BlogPost.STATUS_DRAFT)

        delete = client.delete(detail)
        self.assertEqual(delete.status_code, 204)
