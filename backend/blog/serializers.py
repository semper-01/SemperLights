from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import BlogCategory, BlogPost

User = get_user_model()


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ('id', 'name', 'slug')


class BlogPostSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=BlogCategory.objects.all())

    class Meta:
        model = BlogPost
        fields = (
            'id',
            'title',
            'slug',
            'excerpt',
            'content',
            'featured_image',
            'status',
            'published_at',
            'author',
            'category',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
