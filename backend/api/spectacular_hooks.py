from django.conf import settings


def filter_endpoints(endpoints):
    filtered = []
    for path, path_regex, method, callback in endpoints:
        if settings.DEBUG is False and (
            path.startswith("/private_api/") or path.startswith("/oscar-api/")
        ):
            continue
        filtered.append((path, path_regex, method, callback))
    return filtered
