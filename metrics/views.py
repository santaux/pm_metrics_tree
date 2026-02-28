import json
from django.shortcuts import render
from django.http import JsonResponse
from .models import MetricNode


def tree_view(request):
    return render(request, 'metrics/tree.html')


def tree_data_api(request):
    roots = MetricNode.objects.filter(parent=None).prefetch_related(
        'children__children__children__children'
    )
    data = [node.to_dict() for node in roots]
    return JsonResponse(data, safe=False)


def node_detail_api(request, slug):
    try:
        node = MetricNode.objects.get(slug=slug)
        return JsonResponse(node.to_dict())
    except MetricNode.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
