"""
인증 API 요청/응답을 만드는 serializer.

astronomy의 serializer와 성격이 다르다.
astronomy/serializer ─ "DB에 있는 값을 어떠한 형태로 보여줄지"
accounts의 serializer ─ 문지기 역할 ("들어온 값이 유효한가")
exoplanet filters.py의 ExoplanetSearchParams와 같은 결의 "문지기" 패턴
"""

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import RegexValidator

from rest_framework import serializers


# Django User.username 자체 검증기(UnicodeUsernameValidator)는 한글도 통과시킨다.
# 명세(04 ─ 4.3절) "영문/숫자/_"보다 느슨하므로, 직접 좁혀야 한다.
# 비유: 정문 경비(Django 기본)는 느슨하고, 건물 규정(명세)은 훨씬 엄격하다.
USERNAME_VALIDATOR = RegexValidator(
    regex=r'^[a-zA-Z0-9_]{3,30}$',
    message='아이디는 영문, 숫자, _만 사용해 3~30자 이내로 입력해 주세요.',
)

class UserBriefSerializer(serializers.Serializer):
    """
    응답 안에 반복해서 등장하는 user 블록 {id, username, email}.
    signup/login/me 세 곳이 전부 이 모양을 그대로 사용한다 ─ 한 번만 정의해 재사용.
    """
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()


class SignupSerializer(serializers.Serializer):
    """
    문서 04 ─ 4.3절. Django의 ModelSerializer 대신 평범한 Serializer를 사용한 이유:
    password_confirm은 User 모델에 존재하지 않는 field라서(DB 저장 X),
    ModelSerializer로 만들면 이 필드 하나 때문에 제외 설정이 더 늘어난다.
    """
    username = serializers.CharField(validators=[USERNAME_VALIDATOR])
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # write_only=True ─ 응답 JSON에 비밀번호가 절대 다시 나가지 않도록 한다.
    # 비유: "쓰기 전용 우편함" ─ 넣을 수는 있어도 다시 꺼내볼 수는 없다.
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value):
        # validate_<필드명> 형식으로 method를 만들면, DRF가 해당 필드 검증 시점에
        # 자동으로 이 method를 호출해준다. ─ 이름 자체가 곧 "연결선"이다.
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 사용 중인 아이디 입니다.")
        return value

    def validate_email(self, value):
        # ⚠️ User.email은 DB에 UNIQUE 제약이 걸려있지 않다.이 확인은 어플리케이션 레벨
        # 방어일 뿐이라, 동시에 같은 이메일로 중복 요청이 들어오면 이론상 뚫릴 수 있다.
        # neo_watchlist의 UNIQUE 제약과 달리 "최종 방어선"이 없는 상테
        # MVP 규모에서는 감수하기로 결정. ─ 꼭 기록해둘것
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입닌다.")
        return value

    def validate_password(self, value):
        # Django의 AUTH_PASSWORD_VALIDATIONS(8자 이상 등 settings.py에 등록된 4종)를
        # 그대로 재사용한다. 새로운 규칙을 만들지 않는 이유 ─
        # 이미 검증된 규칙을 두 곳에 흩어두면 나중에 하나만 고치는 실수가 생길 가능성이 높다.
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            # Django 예외와 DRF 예외는 서로 다른 종류이기 때문에 그대로 throw하지 못한다.
            # exc.messages(문구 리스트)만 꺼내서 DRF 예외로 다시 포장한다.
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        # validate_<필드명>은 필드 하나만 보는데, "두 필드를 비교"하려면
        # 필드별 검증이 전부 끝난 뒤 실행되는 이 method(객체 단위 검증)가 필요하다.
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": ["비밀번호가 일치하지 않습니다."]}
            )
            return attrs

    def create(self, validated_data):
        # password_confirm은 User 모델에 없는 필드라 DB에 넣기 직전에 버린다.
        validated_data.pop("password_confirm")
        # create_user()를 사용하는 이유 ─ 비밀번호를 평문 그대로 저장하지 않고
        # 내부적으로 hash(암호화)해서 저장해준다. User(...)로 직접 생성할 경우
        # 평문 비밀번호가 그대로 DB에 저장되는 사고가 발생한다.
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )    


class LoginSerializer(serializers.Serializer):
    """
    문서 04 ─ 4.4절. 여기에서는 "형식이 맞는지"만 확인한다.
    "실제로 이 ID/PW 조합이 맞는지"는 view에서 authenticate()로 확인 
    ─ 형식 검증(serializer)과 인증 판정(view)의 책임을 분리해둔다.
    """
    usernme = serializers.CharField()
    password = serializers.CharField(write_only=True)
