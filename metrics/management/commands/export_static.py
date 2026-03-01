from django.core.management.base import BaseCommand

from metrics.export import export_static


class Command(BaseCommand):
    help = 'Export the metrics tree as a static HTML site for GitHub Pages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output', '-o',
            default=None,
            metavar='DIR',
            help='Output directory (default: docs/ in project root)',
        )

    def handle(self, *args, **options):
        self.stdout.write('Generating static export…')
        try:
            result = export_static(options['output'])
            self.stdout.write(self.style.SUCCESS(
                f"✓ Static site written to: {result['output_dir']}"
            ))
            self.stdout.write('  Files generated:')
            for f in result['files']:
                self.stdout.write(f'    {f}')
            self.stdout.write('')
            self.stdout.write('Next steps:')
            self.stdout.write('  git add docs/')
            self.stdout.write('  git commit -m "chore: update GitHub Pages export"')
            self.stdout.write('  git push')
            self.stdout.write('  Then enable GitHub Pages → Source: docs/ folder.')
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Export failed: {exc}'))
            raise
