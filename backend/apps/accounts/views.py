"""
인증 API. 문서 04 ─ 4장.

이 파일에서 유일하게 astronomy/watchlist와 차이점:
DB 모델(Neo, Exoplanet과 같은)을 직접 조회하지 않는다.
Django 기본 제공 메서드들을 그대로 횔용한다. ─ request.user / login() / logout()
"""

from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from config.exception_handler import InvalidCredentials
from config.permissions import IsAuthenticatedOr401

from .serializers import LoginSerializer, SignupSerializer, UserBriefSerializer

class CsrfView(APIView):
    """
    GET /api/auth/csrf/ ─ 문서 04, 4.1절.
    앱 실행 시 최초 1회만 호출하여 csrftoken 쿠키를 심는 용도
    """
    def get(self, request):
        # get_token()을 호출하는 그 순간, Django가 응답에 Set-Cookie 헤더를 까워넣는다.
        # 반환값(token String 자체)은 사용하지 않는다. ─ "쿠키를 심는 동작"이 목적이기 때문에,
        # 그 값을 몸통(JSON)에 담아보내는 것이 아니다. (문서 04 ─ 4.1절: 본문엔 token을 담지 않는다.)
        get_token(request)
        return Response({"detail": "CSRF cookie set"})


class MeView(APIView):
    """
    GET /api/auth/me/ ─ 문서 04, 4.2절
    permission_classes에 아무것도 붙이지 않은 것은 의도적인 행동이다.
    비로그인도 정상적으로 200을 받아야 하는 endpoint기 때문에 (문서 04 ─ "401을 반환하지 않는다.")
    LogoutView처럼 IsAuthenticatedOr401을 붙이면 안 된다.
    """    
    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                "is_authenticated": True,
                "user": UserBriefSerializer(request.user).data,
            })
        return Response({"is_authenticated": False, "user": None})


class SignupView(APIView):
    """
    POST /api/auth/signup/ ─ 문서 04, 4.3절
    가입과 동시에 로그인 처리한다 ─ "저장버튼을 누르려다 여기까지 온" 사용자의
    단계를 하나 줄이기 위함 (문서 04 ─ 4.3절 각주).
    """
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        # raise_exception=True ─ 검증 실패 시 여기서 바로 ValidationError를 throw한다.
        # 이 예외는 exception_handler.py가 받아서 {"error": {..., "fields": {...}}}로
        # 자동 포장한다. 이 view안에서 직접 400으로 조립할 필요가 없다.
        serializer.is_valid(raise_exception=True)
        try: 
            user = serializer.save()  # 내부적으로 serializer.create()를 호출한다.
        except IntegrityError:
            # serializer의 validate_username/validate_email이 이미 걸러주지만
            # 요청 두 개가 동시에 들어오면 둘 다 없음 판정을 받고 통과할 수 있다.
            # DB의 UNIQUE 인덱스가 그 마지막 요청 하나를 막아주고, 
            # 그 결과를 사용자가 읽을 수 있는 400 코드고 번역한다.
            #
            # 어느 쪽이 걸렸는지(username인지 email인지) 구분짓지 않는 이유
            # ─ 구분하려면 DB Error 메시지 String을 Parsing해야 하는데, 그 케이스는 
            # DB 버전이 바뀌면 조용히 깨지는 코드이다. 애초에 여기까지 오는 경우는 극히 드물다.
            raise ValidationError(["이미 사용 중인 아이디 또는 이메일입니다."])    

        # Django 세션 로그인 ─ 이 한 줄이 을답 header에 Set-Cookie: sessionid=...를 실어 보낸다.
        # Browser는 이후 요청마다 이 Cookie를 자동으로 동봉한다.
        login(request, user)

        return Response(
            {
                "is_authenticated": True,
                "user": UserBriefSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/ ─ 문서 04, 4.4절

    ⚠️ 실패 시 401이 아니라 400이다 (문서 1.3절 표에 명시되어 있음).
    직관적으로 401을 쓰고 싶어지는 자리이지만, 이건 "당신이 누구인지 증명되지 않음"이라는 뜻이 아니라
    "그런 조합 자체가 틀림"이라는 판단이라 400으로 분류해둔 것.
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # authenticate()는 ID/PW가 틀리면 예외 없이 None을 준다.
        # "ID 없음" / "틀린 비밀번호"를 구분지어 알려주지 않는 이유
        # ─ 구분지어 알려줄 경우 공격자가 "이 아이디는 존재한다"는 걸 
        # 확인하는 계정 열거 공격의 재료가 된다. (문서 04 ─ 4.4절 각주)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise InvalidCredentials()

        login(request, user)
        return Response({
            "is_authenticated": True,
            "user": UserBriefSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/ ─ 문서 04, 4.5절. 유일하게 인증이 필요한 endpoint.

    IsAuthenticatedOr401을 사용하는 이유 ─ 이번 세션 에서 만든 class를 처음 실전에 투입하는 자리이다.
    로그아웃 되지 않은(비로그인) 상태에서 로그아웃을 재시도 하면 401 + AUTH_REQUIRED가 나가야 정상임.
    """    
    permission_classes = [IsAuthenticatedOr401]

    def post(self, request):
        logout(request)  # 세션 자체를 서버에서 지운다.
        return Response(status=status.HTTP_204_NO_CONTENT)
