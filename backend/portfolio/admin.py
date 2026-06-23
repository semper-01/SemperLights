from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Technology, Project, ProjectImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	prepopulated_fields = {'slug': ('name',)}
	search_fields = ('name',)
	ordering = ('name',)


@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
	list_display = ('name', 'website')
	search_fields = ('name',)
	ordering = ('name',)


class ProjectImageInline(admin.TabularInline):
	model = ProjectImage
	extra = 1
	readonly_fields = ()


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ('title', 'category', 'status', 'featured', 'created_at')
	list_filter = ('status', 'featured', 'category')
	search_fields = ('title', 'short_description')
	ordering = ('-featured', 'display_order')
	readonly_fields = ('created_at', 'updated_at')
	prepopulated_fields = {'slug': ('title',)}
	inlines = [ProjectImageInline]
	filter_horizontal = ('technologies',)
