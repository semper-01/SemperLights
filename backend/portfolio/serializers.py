from rest_framework import serializers

from .models import Category, Project, ProjectImage, Technology


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description')


class TechnologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Technology
        fields = ('id', 'name', 'icon', 'website')


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ('id', 'image', 'caption', 'display_order', 'project')
        read_only_fields = ('id', 'project')


class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = (
            'id',
            'title',
            'slug',
            'short_description',
            'full_description',
            'thumbnail',
            'cover_image',
            'featured',
            'display_order',
            'status',
            'live_demo',
            'github_url',
            'started_at',
            'completed_at',
            'category',
            'technologies',
            'images',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'images', 'created_at', 'updated_at')
