"""
DRF가 만들어낸 오류 응답을, 문서 04 1.4절의 공통 봉투 형식으로 재포장 한다.

이 파일의 역할은 "변역"이 아닌 "재포장"이다.
무엇이 잘못되었는지 판단하는 작업은 DRF가 하고, 그 결과물을 상자만 바꾼다.
"""

from rest_framework import exceptions
from rest_framework.views import exception_handler as drf_exception_handler


# 상태 코드만 보고 기본 code를 고르는 표
# 비유: 우편번호부 — 404로 가는 건 일단 NOT_FOUND 창구로 보내라.
# 문서 04 — 1.4절 "오류 코드 목록"을 그대로 옮긴 것
DEFAULT_CODE_BY_STATUS = {
    400: "VALIDATION_ERROR",
    401: "AUTH_REQUIRED",
    403: "CSRF_FAILED",
    404: "NOT_FOUND",
    409: "ALREADY_EXISTS",
    429: "RATE_LIMITED",
    503: "UPSTREAM_ERROR",
}

# DRF 기본 예외의 메시지는 전부 영어이다. (예: "Not found.", "Request was throttled...").
# 사용자에게 그대로 보여줄 수 없으니, 한글 문구로 갈아끼울 "사전"을 따로 둔다.
DEFAULT_MESSAGE_BY_STATUS = {
    400: "입력값을 확인해 주세요.",
    401: "로그인이 필요합니다.",
    403: "요청이 거부되었습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    404: "요청하신 정보를 찾을 수 없습니다.",
    409: "이미 등록된 항목입니다.",
    429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    503: "외부 데이터 서버에 연결할 수 없습니다.",
}

FALLBACK_MESSAGE = "요청을 처리하지 못했습니다."


# ────────────────────────────────────────────────────────────────
# cosmic-watch-explorer 전용 예외들
#
# DRF 기본 제공 예외(NotFound, ValidationError 등)로는
# INVALID_DATE / ALREADY_EXISTS / UPSTREAM_ERROR 를 표현할 수 없다.
# 따라서, "프로젝트 사정에 맞는 예외"를 직접 만들어 둔다.
#
# views 사용 규칙 명시 → raise InvaliDate()
# 이렇게 규칙을 정해두면 위 handler가 자동으로 봉투에 담아 보낸다. 
# ────────────────────────────────────────────────────────────────
class InvalidDate(exceptions.APIException):
    status_code = 400
    default_code = "INVALID_DATE"
    default_detail = "날짜는 YYYY-MM-DD 형식이어야 합니다." 
    is_custom_error = True   # ⭐ 추가
    

class InvalidCredentials(exceptions.APIException):
    status_code = 400
    default_code = "INVALID_CREDENTIALS"
    # 아이디가 없는 건지 비밀번호가 틀린 건지 절대 구분해서 말하지 않는다.
    # M2 완료 기준 ─ "로그인 실패 응답에 아이디 존재 여부가 드러나지 않는다."
    default_detail = "아이디 또는 비밀번호가 올바르지 않습니다."
    is_custom_error = True   # ⭐ 추가
    
    
class AlreadyExists(exceptions.APIException):
    status_code = 409
    default_code = "ALREADY_EXISTS"
    default_detail = "이미 관심 목록에 등록된 항목입니다."
    is_custom_error = True   # ⭐ 추가


class UpstreamError(exceptions.APIException):
    status_code = 503
    default_code = "UPSTREAM_ERROR"
    default_detail = "NASA 데이터 서버에 연결할 수 없습니다."
    is_custom_error = True   # ⭐ 추가
    

def custom_exception_handler(exc, context):
    """DRF가 예외를 만날 때마다 자동으로 호출하는 함수."""
    
    # ① 먼저 DRF 기본 처리기에 넘긴다.
    #   Http404를 404로, 권한 없음을 403으로 바꾸는 판단은 DRF가 기본으로 처리한다.
    #   바퀴를 다시 말들 필요가 없으니 완성된 결과물을 받아서 포장만 바꾼다.
    response = drf_exception_handler(exc, context)
    
    # ② response = None → "DRF도 모르는 예외"
    #   ZeroDivisionError, 오타로 인한 AttributeError 같은 코드의 진짜 버그이다.
    #   JSON으로 포장을 해버리면 개발 중에 원인(트레이스백)을 찾지 못한다.
    #   따라서, 일부러 손대지 않고 흘려보낸다. → Django가 500 + 트레이스백을 띄운다.
    #   비유: 화재경보기가 "시끄럽다"고 떼버리면 안 되는 것과 같은 이유
    if response is None:
        return None
    
    status_code = response.status_code
    
    # ③ code 정하기
    #   만들어둔 예외를 문자열 생김새(대/소문자 여부)로 추측하지 않는다. 
    #   각 예외 클래스에 is_custom_error = True를 직접 선언해두었으므로, 그 값을 그대로 읽는다.
    #   비유: 옷차림만으로 정직원 여부를 추측하지 않고 사원증 자체를 확인하는 것.
    is_our_own = getattr(exc, "is_custom_error", False)
    raw_code = getattr(exc, "default_code", "") or ""
    
    if is_our_own:
        code = raw_code
    else:
        code = DEFAULT_CODE_BY_STATUS.get(status_code, "VALIDATION_ERROR")
    
    # ④ message와 field 정하기
    #   detail의 생김새가 세 자리라 각각 다르게 다뤄야 한다.
    detail = getattr(exc, "detail", None)
    message = DEFAULT_MESSAGE_BY_STATUS.get(status_code, FALLBACK_MESSAGE)
    fields = None
    
    if isinstance(detail, dict):
        # Serializer 검증 실패 → {"password": ["8자 이상"], "username": [...]}
        # 통째로 fields에 넣는다. 필드별로 어느 부분이 틀렸는지가 그대로 살아있다.
        fields = detail
    elif isinstance(detail, list):
        # {"non_field_errors": [...]} 없이 list만 온 경우, 첫 문장만 사용한다.
        if detail:
            message = str(detail[0])
    elif detail is not None and is_our_own:
        # 만들어둔 예외는 문구도 한글로 작성했으므로 그대로 사용
        # 반대로 DRF 기본 예외는 영어라서, 위에서 정한 한글 문구를 유지한다.
        message = str(detail) 
    
    # ⑤ 최종 조립. 문서 04 — 1.4절과 똑같이.
    error_body = {"code": code, "message": message}
    if fields:
        error_body["fields"] = fields   # 폼이 아닌 경우엔 키를 아예 넣지 않는다.
        
    response.data = {"error": error_body}
    return response                                           
