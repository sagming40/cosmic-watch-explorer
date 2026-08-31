"""
DRF 기본 페이지네이션의 응답 모양을, 문서 04 — 1.5절 형식으로 바꾼다.

기본값과 다른 점 한 가지: next/previous(전체 URL 문자열) 대신
page/total_pages(숫자)를 내려준다. Front에서 URL을 Parsing하지 않아도
"지금이 몇 페이지인지"를 바로 알 수 있게 해준다.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CommonPagination(PageNumberPagination):
    # 페이지 하나 당 몇 건씩 담을건지. 문서 04 — 1.5절(예시: page_size: 20)이 default
    page_size = 20
    
    # 클라이언트가 ?page_size=50 과 같은 형식으로 요청하면 그 값을 우선 사용하는 걸 허용할지에 대한 여부.
    # 이름을 지정해야 실제로 동작한다 — 지정해 주지 않는다면 클라이언트는 개수를 수정하지 못한다.
    page_size_query_param = "page_size"
    
    # page_size를 요청해도 여기까지만 허용
    # max_page_size를 지정하지 않으면 ?page_size=999999 와 같이 
    # 악의적으로 DB를 한꺼번에 다 퍼올수 있다. 
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        DRF DEFAULT: {"count", "next", "previous", "results"}
        CUSTOM: {"count", "page", "page_size", "total_pages", "results"}
        
        self.page는 Django Paginator가 이미 계산해준 "현재 페이지 객체"
        여기서 필요한 숫자를 그대로 꺼내 쓴다 — 직접 나눗셈을 할 필요 없음.
        """
        return Response({
            "count": self.page.paginator.count,              # 전체 행 수
            "page": self.page.number,                        # 현재 페이지 번호 (1부터 시작)
            "page_size": self.get_page_size(self.request),   # 실제 적용된 페이지 크기
            "total_pages": self.page.paginator.num_pages,    # 전체 페이지 수
            "results": data,
        })
