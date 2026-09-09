"""
auth_user.email에 UNIQUE 인덱스를 추가한다.

Django 모델을 건드리지 않고 SQL을 직접 사용하는 이유:
email UNIQUE 정석 구현 방법은 AbstractUser 상속 커스텀 User 모델이지만,
프로젝트 시작 지접에 했어야할 작업이었다. 지금은 watchlist/0001이 이미
auth.User를 FK로 참조하고 있어 모델을 갈아끼우려면 
migration 전체 폐기 + DB 재생성 작업이 필요하다.

UNIQUE 제약은 본래 Django가 아닌 DB의 기능이다.
모델의 unique=True도 결국 이 SQL 한 줄을 만들어내는게 전부이다.
─ neo_watchlist의 UniqueConstraint가 uk_nw_user_neo 인덱스가 됐던 것과 같다.

⚠️ Django의 User.email은 blank=True. 미입력 시 NULL이 아닌 ''이 들어간다.
MariaDB는 NULL은 여러 개 허용하지만 ''은 정식 값이라 중복을 막는다.
→ "이메일이 비어 있는 계정"은 전체에서 최대 1개만 존재할 수 있다.
   (createsuperuser 시 이메일을 반드시 입력할 것)
   MariaDB는 부분 UNIQUE Index(WHERE 조건부)를 지원하지 않아 우회 불가. 
"""

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        # auth 앱의 User 테이블이 이미 만들어진 뒤에 실행되도록 순서를 못 박는다.
        # 비유: 초기 구조 벽의 다 세워진 후 못을 박는 것과 같다.
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE UNIQUE INDEX uk_auth_user_email ON auth_user (email);",
            # reverse_sql ─ migrate로 되돌릴 때(rollback) 실행될 SQL.
            # 비워두게 되면 이 migration은 "되돌리 수 없는 작업"으로 표시된다.
            # 현재 집 PC/학교 PC/노트북으로 개발을 병행하고 있기 때문에 왕복 가능하게 만들어둔다.
            reverse_sql="DROP INDEX uk_auth_user_email ON auth_user;",
        ),
    ]
