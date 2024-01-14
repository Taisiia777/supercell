from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class DefaultPageNumberPagination(PageNumberPagination):
    page_size = 30
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "page": self.page.number,
                "total_pages": self.page.paginator.num_pages,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "page": {"type": "integer"},
                "total_pages": {"type": "integer"},
                "next": {"type": "string", "nullable": True},
                "previous": {"type": "string", "nullable": True},
                "results": schema,
            },
        }
