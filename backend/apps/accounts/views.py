"""
인증 API. 문서 04 ─ 4장.

이 파일에서 유일하게 astronomy/watchlist와 차이점:
DB 모델(Neo, Exoplanet과 같은)을 직접 조회하지 않는다.
Django 기본 제공 메서드들을 그대로 횔용한다. ─ request.user / login() / logout()
"""

from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.http import HttpResponse
from django.middleware.csrf import get_token

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from config.exception_handler import InvalidCredentials, ResourceNotFound
from config.permissions import IsAuthenticatedOr401

from .avatar import AvatarError, process_avatar
from .models import UserAvatar, UserPreference
from .serializers import (
    EmailChangeSerializer, LoginSerializer, PasswordChangeSerializer, PasswordOnlySerializer,
    PreferenceSerializer, SignupSerializer, UserBriefSerializer,
)

class CsrfView(APIView):
    """
    GET /api/auth/csrf/ ─ 문서 04, 4.1절.
    앱 실행 시 최초 1회만 호출하여 csrftoken 쿠키를 심는 용도
    AllowAny ─ 전역 기본값이 "로그인 필요"(settings.py)라 열어 줘야 한다. 로그인 폼을 보내려면 이 쿠키가 먼저 있어야 한다.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # get_token()을 호출하는 그 순간, Django가 응답에 Set-Cookie 헤더를 까워넣는다.
        # 반환값(token String 자체)은 사용하지 않는다. ─ "쿠키를 심는 동작"이 목적이기 때문에,
        # 그 값을 몸통(JSON)에 담아보내는 것이 아니다. (문서 04 ─ 4.1절: 본문엔 token을 담지 않는다.)
        get_token(request)
        return Response({"detail": "CSRF cookie set"})


class MeView(APIView):
    """
    GET /api/auth/me/ ─ 문서 04, 4.2절
    비로그인도 정상적으로 200을 받아야 하는 endpoint기 때문에 (문서 04 ─ "401을 반환하지 않는다.")
    LogoutView처럼 IsAuthenticatedOr401을 붙이면 안 된다.
    (10-27까지는 아무것도 안 붙이면 열려 있었지만, 전역 기본값이 "로그인 필요"로 바뀌어 AllowAny를 명시한다)
    """
    permission_classes = [AllowAny]

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
    AllowAny ─ 가입은 당연히 비로그인 상태에서 한다.
    throttle_scope ─ 같은 IP에서 시간당 10번까지 (계정 대량 생성 막기). settings.py DEFAULT_THROTTLE_RATES
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth_signup"

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
    AllowAny ─ 로그인도 비로그인 상태에서 한다.
    throttle_scope ─ 같은 IP에서 분당 10번까지 (비밀번호 무한 대입 막기, 10-28).
      성공·실패 구분 없이 센다 ─ "실패만 센다"고 하면 성공 응답 여부로 비밀번호를 맞혔는지가 드러날 수 있다.
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth_login"

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
    POST /api/auth/logout/ ─ 문서 04, 4.5절. 인증 API 중 유일하게 인증이 필요한 endpoint.

    IsAuthenticatedOr401을 사용하는 이유 ─ 이번 세션 에서 만든 class를 처음 실전에 투입하는 자리이다.
    로그아웃 되지 않은(비로그인) 상태에서 로그아웃을 재시도 하면 401 + AUTH_REQUIRED가 나가야 정상임.
    """    
    permission_classes = [IsAuthenticatedOr401]

    def post(self, request):
        logout(request)  # 세션 자체를 서버에서 지운다.
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
# 마이페이지 API ─ /api/account/ (문서 04, 4.6절 · 10-28 추가)
# 전부 로그인 필요 ─ 전역 기본값(IsAuthenticatedOr401)을 그대로 쓰므로 permission_classes를 안 붙인다.
#
# 비밀번호를 다시 받는 곳(이메일 변경·비밀번호 변경·탈퇴)은 횟수 제한 account_sensitive(시간당 10번).
# "현재 비밀번호" 칸도 로그인 칸처럼 무한 대입 통로가 될 수 있어서다.
# 비유: 은행 앱이 로그인돼 있어도 송금할 땐 비밀번호를 한 번 더 묻는 것 ─ 세션만 훔친 사람이 계정을 통째로 못 가져가게.
# ═══════════════════════════════════════════════════════════════════
def _check_password_or_400(user, raw, field):
    if not user.check_password(raw):
        raise ValidationError({field: ["비밀번호가 올바르지 않습니다."]})


class AccountView(APIView):
    """
    GET    /api/account/ ─ 마이페이지 "내 정보" (user 블록 + 관심 천체 개수)
    DELETE /api/account/ ─ 탈퇴. 본문 {password}. 관심 천체·설정은 CASCADE로 같이 지워진다
    """
    throttle_scope = "account_sensitive"

    def get_throttles(self):
        # 조회(GET)는 세지 않는다 ─ 비밀번호를 받는 DELETE만 계량기를 단다
        return [] if self.request.method == "GET" else super().get_throttles()

    def get(self, request):
        user = request.user
        return Response({
            "user": UserBriefSerializer(user).data,
            "watchlist_counts": {
                # related_name은 watchlist/models.py에서 정한 이름 (neo_watchlist / exoplanet_watchlist)
                "neo": user.neo_watchlist.count(),
                "exoplanet": user.exoplanet_watchlist.count(),
            },
        })

    def delete(self, request):
        serializer = PasswordOnlySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        _check_password_or_400(user, serializer.validated_data["password"], "password")
        logout(request)   # 세션부터 끊고
        user.delete()     # 계정 삭제 ─ NeoWatchlist·ExoplanetWatchlist·UserPreference가 CASCADE로 같이
        return Response(status=status.HTTP_204_NO_CONTENT)


class PreferenceView(APIView):
    """PATCH /api/account/preferences/ ─ 표시 설정 일부만 바꾸기. 응답은 바뀐 뒤의 설정 3칸 전부"""

    def patch(self, request):
        serializer = PreferenceSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # 처음 바꾸는 사람은 이때 행이 생긴다(update_or_create). 안 보낸 칸은 그대로
        pref, _ = UserPreference.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
        return Response(PreferenceSerializer(pref).data)


class EmailChangeView(APIView):
    """PATCH /api/account/email/ ─ 본문 {email, password}. 응답은 user 블록"""
    throttle_scope = "account_sensitive"

    def patch(self, request):
        user = request.user
        serializer = EmailChangeSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        _check_password_or_400(user, serializer.validated_data["password"], "password")
        user.email = serializer.validated_data["email"]
        try:
            user.save(update_fields=["email"])
        except IntegrityError:
            # auth_user.email은 DB UNIQUE(accounts 0001 마이그레이션) ─ 동시에 같은 이메일로 바꾼 경우의 마지막 방어선
            raise ValidationError({"email": ["이미 사용 중인 이메일입니다."]})
        return Response({"user": UserBriefSerializer(user).data})


class PasswordChangeView(APIView):
    """
    POST /api/account/password/ ─ 본문 {current_password, new_password, new_password_confirm}. 응답 204

    ⚠️ Django는 비밀번호가 바뀌면 그 사용자의 세션을 전부 무효로 본다(세션에 비밀번호 해시 일부가 들어 있다).
    update_session_auth_hash로 "지금 이 기기" 세션만 새 비밀번호로 다시 묶는다 → 지금 기기는 로그인 유지,
    다른 기기(예: 집 PC)는 로그아웃된다. 비밀번호를 바꾸는 이유가 보통 "남이 알게 됐을까 봐"라서 이게 맞다.
    """
    throttle_scope = "account_sensitive"

    def post(self, request):
        user = request.user
        serializer = PasswordChangeSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        _check_password_or_400(user, serializer.validated_data["current_password"], "current_password")
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        update_session_auth_hash(request, user)
        return Response(status=status.HTTP_204_NO_CONTENT)



class AvatarView(APIView):
    """
    /api/account/avatar/ ─ 프로필 사진 (문서 04, 4.6절 · 10-28 추가)
      GET    → 내 사진(image/webp). 없으면 404
      PUT    → multipart "avatar" 파일 1개. 서버가 이미지로 열어 보고 256×256 WebP로 새로 만들어 저장 → user 블록
      DELETE → 기본(머리글자)으로 → user 블록

    로그인 필요(전역 기본값). 주소에 사용자 id가 없다 ─ 항상 "내" 사진만 다룬다(남의 사진을 주소로 꺼낼 수 없게).
    """
    throttle_scope = "account_avatar"

    def get_throttles(self):
        # 보기(GET)는 헤더가 그릴 때마다 부르므로 세지 않는다. 올리기·지우기만 시간당 30번
        return [] if self.request.method == "GET" else super().get_throttles()

    def get(self, request):
        row = UserAvatar.objects.filter(user=request.user).only("image").first()
        if row is None:
            raise ResourceNotFound("프로필 사진이 없습니다.")
        response = HttpResponse(bytes(row.image), content_type="image/webp")
        # 주소의 ?v=가 바뀌면 다른 주소라, 같은 주소는 오래 캐시해도 된다. private ─ 공용 캐시(프록시)엔 저장 금지
        response["Cache-Control"] = "private, max-age=31536000, immutable"
        return response

    def put(self, request):
        uploaded = request.FILES.get("avatar")
        if uploaded is None:
            raise ValidationError({"avatar": ["사진 파일을 골라 주세요."]})
        try:
            data = process_avatar(uploaded)
        except AvatarError as exc:
            raise ValidationError({"avatar": [str(exc)]})
        UserAvatar.objects.update_or_create(user=request.user, defaults={"image": data})
        return Response({"user": UserBriefSerializer(request.user).data})

    def delete(self, request):
        UserAvatar.objects.filter(user=request.user).delete()
        return Response({"user": UserBriefSerializer(request.user).data})
