from django import template
from django.templatetags.static import static

register = template.Library()


@register.simple_tag(takes_context=True)
def absolute_static(context, path):
    static_path = static(path)
    return context["request"].build_absolute_uri(static_path)
