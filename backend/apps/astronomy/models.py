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
