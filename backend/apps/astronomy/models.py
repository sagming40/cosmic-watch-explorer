from django.db import models

class Neo(models.Model):
    """
    소행성 '본체' 정보 ─ 여기에 있는 값들은 거의 바뀌지 않는 값들이다.
    (매번 바뀌는 '언제 지구에 접근했나' 같은 값들은 CloseApproach가 따로 맡음)
    """
    nasa_id = models.CharField(max_length=20, unique=True)
    # ⬆️ Neo 테이블 핵심 컬럼 ─ NASA에서 가져오는 ID를 PK가 아닌 UNIQUE 컬럼으로 구분짓는 이유
    # 비유: "외부 회사 사원번호"와 "우리 회사 사원번호"를 분리하는 것. (문서 02 ─ 1.4절)
    # NASA ID 체계가 바뀌어도 DB의 관계는 깨지지 않음
    
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=50, null=True, blank=True)
    
    absolute_magnitude = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    
    # 직경을 min/max 두 개로 나눈 이유 (문서 02 ─ 3.1절)
    # NASA에서 측정한 값은 정확한 직경이 아닌 추정치이다. ─ "행성의 밝기로 범위 추정"
    # 평균을 내서 하나로 합치면 원본이 왜곡되므로 범위 그대로 저장
    diameter_min_m = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True
    )
    diameter_max_m = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True
    )
    
    is_hazardous = models.BooleanField(default=False, db_index=True)
    # ⬆️ db_index=True ─ 해당 컬럼으로 자주 필터링을 하므로 찾아보기(색인)를 만들어 두는 것
    # 위험 소행성 필터링은 자주 사용하게 될 기능이라 index를 걸어둠.
    
    is_sentry_object = models.BooleanField(default=False)
    jpl_url = models.URLField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    # ⬆️ auto_now_add: "이 행이 처음 생성될 때 최초 1회" 현재 시각을 자동으로 채워넣어 줌
    updated_at = models.DateTimeField(auto_now=True)
    # ⬆️ auto_now: "이 행이 저장될 때마다 매번" 현재 시각을 덮어씀.
    # 비유: 편의점 재고표 
    # "입고일(auto_now_add)" / "마지막 재고 확인일(auto_now)" 두 개를 각각 따로 적어둔다.
    
    class Meta:
        db_table = 'neo'
        # ⬆️ 이렇게 지정해주지 않으면 Django가 테이블 명을 임의로 지어버림 (예: 'astronomy_neo')
        # 문서 02번 DDL과 이름을 맟춰야 하므로 db_table로 직접 지정
    
    def __str__(self):
        return self.name
        # ⬆️ Django Admin이나 shell에서 이 객체를 출력할 때
        # <Neo: object (1)> 대신 <Neo: 357621 (2005 EG94)>처럼 보이게 해줌

class CloseApproach(models.Model):
    """
    소행성이 지구(또는 다른 천체)에 접근한 '사건' 기록
    Neo 클래스 하나에 이 기록이 여러 개 달릴 수 있음 (1:N)
    """
    neo = models.ForeignKey(
        Neo, on_delete=models.CASCADE, related_name='approaches'
    )
    # ⬆️ ForeignKey는 "어떤 소행성의 접근 기록인지"를 가리키는 화살표
    # 비유: 도서관 대출 기록 카드에 몇 번째 책인지 적혀있는 것
    # 
    # on_delete=models.CASCADE:
    # Neo가 하나 삭제되면, 그 소행성에 딸려 있던 접근 기록도 전부 같이 삭제
    # 비유: 빌렸던 책이 폐기되면 그 책의 대출 기록도 사실상 의미가 없어지는 것과 같음
    # 
    # related_name='approaches':
    # 특정 소행성 객체의 접근 기록 전체를 모두 가져올 때 사용할 이름표
    # 예: some_neo.approaches.all()
    # → related_name을 지정해주지 않으면 some_neo.closeapproach_set.all() 처럼
    # 코드의 가독성과 효율성이 떨어짐

    approach_date = models.DateField(db_index=True)  
    # ⬆️ 시간없이 날짜만. (문서 02 ─ 3.2절)
    # DATETIME 컬럼에 함수를 덧씌워 검색을 할 경우, 
    # 인덱스로 찾지 못하므로, 날짜 전용 컬럼을 따로 생성한다.
    # 예: WHERE approach_date = '2026-08-21' 처럼 입력하여 바로 검색 

    approach_datetime_utc = models.DateTimeField()
    # ⬆️ 정확한 시각까지 포함
    # NASA 제공 datetime 형식 ─ "2026-Aug-21 03:16" 
    # 추후 services/nasa_neo.py를 통해 Parsing 하여 이 변수에 대입한다.

    velocity_km_s = models.DecimalField(
        max_digits=12, decimal_places=6, null=True, blank=True
    )

    velocity_km_h = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True
    )

    miss_distance_km = models.DecimalField(
        max_digits=18, decimal_places=4, null=True, blank=True, db_index=True
    )
    # ⬆️ db_index가 붙은 이유
    # "가장 가까이 접근한 순서"로 정렬하는 것이 대시보드의 "핵심 기능"이다.

    miss_distance_au = models.DecimalField(
        max_digits=12, decimal_places=8, null=True, blank=True
    )
    orbiting_body = models.CharField(max_length=30)
    # ⬆️ null 값을 허용 하지 않은 이유: NASA 응답(행성)에 값이 항상 존재. 
    # 값이 없는 경우가 존재하지 않음 — NOT NULL

    class Meta:
        db_table = 'close_approach'
        constraints = [
            models.UniqueConstraint(
                fields=['neo', 'approach_datetime_utc', 'orbiting_body'],
                name='uk_ca_unique'
            )
        ]
        # ⬆️ 이 세 변수 조합이 같아지면 DB에서 "같은 접근 기록"으로 취급해 막아버림
        # "같은 날짜로 fetch_feed를 두 번 실행해도 행 수가 늘어나지 않는다"는
        # 전제를 보장해주는 핵심장치 — **M1 완료 기준**
        # Application 코드에서 "중복 체크 후 저장" 방식이 아닌, DB 자체에서 중복 저장을 
        # 막기 위해 선언해둔다. 더 안전한 방식 (문서 02 3.6절, 동시 요청에도 뚫리지 않음)

class OrbitalData(models.Model):
    """
    소행성의 궤도 정보. Neo 하나 당 딱 하나만 유지한다. (1:1 관계)
    NASA는 관측이 쌓일 때마다 궤도를 다시 계산해서 여러 버전을 제공하지만,
    이 프로젝트에서는 항상 '최신 값'만 덮어써서 보여주면 되므로 1:1로 설계함
    """
    neo = models.OneToOneField(
        Neo, on_delete=models.CASCADE, related_name='orbital_data'
    )
    # ⬆️ ForeignKey와 형제 관계지만 차이점 한 가지
    #  OneToOneField → 내부적으로 "이 컬럼에도 UNIQUE를 같이 걸어라"라고 Django 자동 처리
    # 즉, neo_id 컬럽에 FK + UNIQUE가 동시에 걸림
    # 비유: ForeignKey — "한 사람이 여러번 대출 가능한 회원증"
    #      OneToOneField — "1인 1사물함의 열쇠"
    # 같은 neo_id로 두 번째 행을 넣으려고 하면 DB에서 막음

    orbit_id = models.CharField(max_length=30, null=True, blank=True)
    orbit_determination_datetime_utc = models.DateTimeField(null=True, blank=True)
    first_observation_date = models.DateField(null=True, blank=True)
    last_observation_date = models.DateField(null=True, blank=True)
    data_arc_days = models.IntegerField(null=True, blank=True)
    observations_used = models.IntegerField(null=True, blank=True)

    # 이심률: 비율값이므로 보통 1을 넘지 않거나 작다.
    # — 궤도가 완벽한 원에서 얼마나 벗어났는지를 나타내는 비율
    # — 0: 완벽한 원 / 0~1: 타원 궤도 / 1: 포물선 / 1 초과: 쌍곡선 궤도
    eccentricity = models.DecimalField(
        max_digits=14, decimal_places=10, null=True, blank=True
    )

    # 궤도 긴반지름 (단위: AU) — 오차 방지를 위해 소수점 10자리까지 정밀 저장.
    semi_major_axis_au = models.DecimalField(
        max_digits=14, decimal_places=10, null=True, blank=True
    )

    # 궤도 경사각 
    # — 기준면(예: 지구의 공전 궤도면인 황도면)과 천체의 궤도면이 이루는 각도 (단위: 도, Degree)
    # — 0도 ~ 180도 사이의 값을 가진다.
    inclination_deg = models.DecimalField(
        max_digits=12, decimal_places=8, null=True, blank=True
    )

    # 공전 주기/일(days)
    orbital_period_days = models.DecimalField(
        max_digits=16, decimal_places=8, null=True, blank=True
    )

    # 근일점 거리 — 천체가 태양과 가장 가까워지는 지점까지의 거리 (단위: AU)
    perihelion_distance_au = models.DecimalField(
        max_digits=14, decimal_places=10, null=True, blank=True
    )

    # 원일점 거리 — 천체가 태양과 가장 멀어지는 지점까지의 거리 (단위: AU)
    aphelion_distance_au = models.DecimalField(
        max_digits=14, decimal_places=10, null=True, blank=True
    )
    # ⬆️ 궤도 관련 수치들이 소수점 자릿수가 긴 이유:
    # 이심률(eccentricity)이나 궤도 경사각 같은 값들은 
    # 아주 작은 오차에도 몇년 뒤 위치 예측에서 크게 벌어질 수 있어서, 
    # NASA에서 정밀도를 소수점 10자리 까지 제공하는 경우가 있음.
    # 이 정밀도가 DB에 그대로 적재될 수 있어야 "원본을 훼손하지 않는다"는 
    # 원칙을 지킬수 있음 (문서 02 — 1.1절)

    orbit_class_type = models.CharField(
        max_length=10, null=True, blank=True, db_index=True
    )
    orbit_class_description = models.CharField(max_length=255, null=True, blank=True)
    # ⬆️ orbit_class_type에 db_index가 붙은 이유
    # "APO", "ATE" 같은 궤도 분류로 필터링하는 기능이 있어서 (문서 02 — 4.1절)

    class Meta:
        db_table = 'orbital_data'

class HostStar(models.Model):
    """
    외계행성의 모항성(중심 별) 정보.
    같은 항성계에 속한 행성들은 이 테이블 하나를 공유해서 참조한다.
    (TRAPPIST-1e, TRAPPIST-1f 둘 다 같은 HostStar 행을 가리킴)
    """        
    name = models.CharField(max_length=100, unique=True)
    # ⬆️ unique=True: 같은 이름의 항성이 중복 저장되는 걸 막음
    # exoplanet_archive.py로 수집할 때 "이 항성이 이미 있나?" 
    # 확인 후 존재하지 않으면 새로 생성, 존재하면 기존 참조.
    # 문서 02 — 5.4절 "수집 순서 주의" → host_star 먼저 처리

    distance_pc = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True, db_index=True
    )
    # ⬆️ 핵심 인덱스 중 하나 (문서 02 — 4.1절, 굵게 표시된 4개 중 하나)
    # "거리 100광년 이하" 같은 검색 조건이 이 컬럼을 거쳐간다.
    # 단위가 파섹(pc)이다. 광년(ly)으로 변환하는 계산은 DB에 저장하지 않고
    # 추후 서비스 레이어(백엔드)에서 처리 (문서 02 — 3.4절 → "저장은 pc, 표시는 ly")

    spectral_type = models.CharField(max_length=30, null=True, blank=True)
    temperature_k = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    radius_solar = models.DecimalField(
        max_digits=12, decimal_places=6, null=True, blank=True
    )
    mass_solar = models.DecimalField(
        max_digits=12, decimal_places=6, null=True, blank=True
    )
    metallicity = models.DecimalField(
        max_digits=10, decimal_places=5, null=True, blank=True
    )
    surface_gravity = models.DecimalField(
        max_digits=10, decimal_places=5, null=True, blank=True
    )
    # ⬆️ 이 아래 필드들은 모두 null=True. Neo/Exoplanet의 경우와 같다. 
    # NASA에서 모든 항성의 온도, 반지름, 질량을 다 측정해둔게 아니기 때문에,
    # 값이 없는 경우가 더 많음. NOT NULL이면 값이 없는 항성들은 아예 저장을 못함.

    class Meta:
        db_table = 'host_star'

    def __str__(self):
        return self.name    

class Exoplanet(models.Model):
    """
    외계행성 정보. 하나의 HostStar(항성)에 여러 Exoplanet이 딸릴 수 있음 (1:N).
    """    
    host_star = models.ForeignKey(
        HostStar, on_delete=models.CASCADE, related_name='planets'
    )
    # ⬆️ related_name='planets'로 미리 지정한다.
    # some_star.planets.all() 같은 형태로 "이 항성이 거느린 행성들"을 바로 꺼낼수 있다.
    # CloseApproach의 related_name='approach'와 같은 패턴

    planet_name = models.CharField(max_length=100, unique=True)

    radius_earth = models.DecimalField(
        max_digits=12, decimal_places=6, null=True, blank=True, db_index=True
    )
    mass_earth = models.DecimalField(
        max_digits=14, decimal_places=6, null=True, blank=True, db_index=True
    )
    # ⬆️ radius_earth, mass_earth 모두 핵심 인덱스이다. (문서 02 — 4.1절)
    # "지구 대비 0.8 ~ 1.5배 크기" 같은 조건 검색이 이 컬럼들을 거친다.

    equilibrium_temp_k = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    orbital_period_days = models.DecimalField(
        max_digits=16, decimal_places=8, null=True, blank=True
    )

    discovery_year = models.SmallIntegerField(null=True, blank=True, db_index=True)
    # ⬆️ SmallIntegerField를 사용한 이유: 발견 연도는 1990년대 ~ 2020년대 범위이다.
    # 용량이 큰 정수 타입(IntegerField)을 사용하지 않아도 된다.
    # 문서 02 — DDL에도 SMALLINT로 명시 되어 있다.

    discovery_method = models.CharField(
        max_length=50, null=True, blank=True, db_index=True
    )
    # ⬆️ 이 필드도 값이 없는 경우가 실제로 많다. (문서 02 — 3.5절 예시 JSON 참고)
    # radius_earth, mass_earth, equilibrium_temp_k의 값이 전부 null인 행성도 흔함
    # "발견은 됐지만 아직 상세 측정은 안 된" 상태

    class Meta:
        db_table = 'exoplanet'

    def __str__(self):
        return self.planet_name

class NeoFetchLog(models.Model):
    """
    NASA API를 해당 날짜에 이미 수집했는지를 기록하는 'log' 테이블
    다른 모델들과 달리 FK가 하나도 없는 독립테이블
    
    비유: 편의점 '발주 장부' — 문서 02 3.7절
    선반이 비어있을때 "미발주"와 "발주는 했지만 발주한 상품이 그날 입고 되지 않는다"
    를 구분해주는 장부
    """        
    fetch_date = models.DateField(unique=True)
    # ⬆️ 같은 날짜 중복 기록 ❌
    # 추후 services/nasa_neo.py의 테이블 작성 예시
    #   
    #   1. fetch_date='2026-08-21' — 테이블에 행이 있는지 확인
    #   2. 존재함 → close_approach 테이블에서 바로 조회 (NASA 호출 ❌, 0건이어도 정상)
    #   3. 존재하지 않음 → NASA API 호출 → close_approach에 저장 → 이 테이블에 기록

    fetched_at = models.DateTimeField(auto_now_add=True)
    # ⬆️ "실제 수집을 실행한 시각" — fetch_date(수집 대상 날짜)와는 다른 개념
    # 예: 2026-08-21일자 데이터를 8월 25일에 수집했다면
    # fetch_date=2026-08-21, fetched_at=2026-08-25 처럼 날짜가 다르게 찍힘

    element_count = models.IntegerField(default=0)
    # ⬆️ 그날 NASA가 알려준 소행성 개수. 0이어도 정상임
    # "0개였다는 사실 자체"가 이 로그의 존재 이유이다. 
    
    is_success = models.BooleanField(default=True)
    # ⬆️ NASA API 호출이 실패할 경우 (네크워크 오류, API 한도 초과 등)
    # API 호출에 실패해도 성공한 것처럼 기록이 되면 다음 요청 시
    # 이미 수집한 것으로 잘못 판단하여 영영 재시도를 하지 않음. 성공/실패를 구분해서 남겨둔다.

    class Meta:
        db_table = 'neo_fetch_log'
