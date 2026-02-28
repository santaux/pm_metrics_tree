from django.db import models


CATEGORY_CHOICES = [
    ('root', 'Root'),
    ('growth', 'Growth & Acquisition'),
    ('activation', 'Activation'),
    ('retention', 'Retention'),
    ('engagement', 'Engagement'),
    ('revenue', 'Revenue'),
    ('satisfaction', 'Satisfaction'),
    ('quality', 'Product Quality'),
]

CATEGORY_COLORS = {
    'root': '#26d15f',
    'growth': '#26d15f',
    'activation': '#3b82f6',
    'retention': '#8b5cf6',
    'engagement': '#f59e0b',
    'revenue': '#ec4899',
    'satisfaction': '#06b6d4',
    'quality': '#64748b',
}


class MetricNode(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='growth')
    icon = models.CharField(max_length=10, blank=True, default='')
    short_description = models.TextField(
        help_text='One-sentence summary shown on hover or node label.'
    )
    full_description = models.TextField(
        blank=True,
        help_text='Detailed explanation of what this metric means.',
    )
    formula = models.TextField(
        blank=True,
        help_text='How to calculate this metric (plain text or formula).',
    )
    why_it_matters = models.TextField(
        blank=True,
        help_text='Why PMs should care about this metric.',
    )
    how_to_improve = models.TextField(
        blank=True,
        help_text='Actionable tips to move this metric in the right direction.',
    )
    benchmark = models.TextField(
        blank=True,
        help_text='Industry average or good/great/excellent benchmarks.',
    )
    is_group = models.BooleanField(
        default=False,
        help_text='True if this is a category group node rather than a leaf metric.',
    )
    order = models.PositiveIntegerField(default=0, help_text='Sibling sort order.')

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    @property
    def color(self):
        return CATEGORY_COLORS.get(self.category, '#26d15f')

    def to_dict(self):
        return {
            'id': self.pk,
            'name': self.name,
            'slug': self.slug,
            'category': self.category,
            'icon': self.icon,
            'color': self.color,
            'short_description': self.short_description,
            'full_description': self.full_description,
            'formula': self.formula,
            'why_it_matters': self.why_it_matters,
            'how_to_improve': self.how_to_improve,
            'benchmark': self.benchmark,
            'is_group': self.is_group,
            'children': [child.to_dict() for child in self.children.all()],
        }
