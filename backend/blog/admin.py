from django.contrib import admin

from .models import BlogCategory, BlogPost


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	prepopulated_fields = {'slug': ('name',)}
	search_fields = ('name',)
	ordering = ('name',)


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
	list_display = ('title', 'author', 'category', 'status', 'published_at')
	list_filter = ('status', 'category')
	search_fields = ('title', 'excerpt', 'content')
	ordering = ('-published_at',)
	readonly_fields = ('created_at', 'updated_at')
	prepopulated_fields = {'slug': ('title',)}
	autocomplete_fields = ('author',)
