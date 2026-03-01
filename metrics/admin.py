from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import path

from .models import MetricNode


@admin.register(MetricNode)
class MetricNodeAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'parent', 'is_group', 'order')
    list_filter   = ('category', 'is_group')
    search_fields = ('name', 'short_description')
    prepopulated_fields  = {'slug': ('name',)}
    list_editable        = ('order',)
    list_select_related  = ('parent',)
    raw_id_fields        = ('parent',)
    change_list_template = 'admin/metrics/metricnode/change_list.html'

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

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                'export-static/',
                self.admin_site.admin_view(self.export_static_view),
                name='metrics_metricnode_export_static',
            ),
        ]
        return custom + urls

    def export_static_view(self, request):
        from metrics.export import export_static
        try:
            result = export_static()
            rel = result['output_dir'].replace(str(__import__('django').conf.settings.BASE_DIR), '').lstrip('/')
            self.message_user(
                request,
                (
                    f'\u2713 Static site exported to \u2009{rel}/\u2009 '
                    f'({len(result["files"])} files). '
                    'Commit docs/ and push \u2014 then enable GitHub Pages \u2192 Source: docs/ folder.'
                ),
                messages.SUCCESS,
            )
        except Exception as exc:
            self.message_user(request, f'Export failed: {exc}', messages.ERROR)
        return redirect('admin:metrics_metricnode_changelist')
