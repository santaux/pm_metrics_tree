from django.contrib import admin
from .models import MetricNode


@admin.register(MetricNode)
class MetricNodeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'parent', 'is_group', 'order')
    list_filter = ('category', 'is_group')
    search_fields = ('name', 'short_description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)
    list_select_related = ('parent',)
    raw_id_fields = ('parent',)
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'parent', 'category', 'icon', 'is_group', 'order'),
        }),
        ('Descriptions', {
            'fields': ('short_description', 'full_description', 'formula'),
        }),
        ('PM Insights', {
            'fields': ('why_it_matters', 'how_to_improve', 'benchmark'),
        }),
    )
