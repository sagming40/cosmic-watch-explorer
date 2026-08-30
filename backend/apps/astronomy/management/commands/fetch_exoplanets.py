from django.core.management.base import BaseCommand
from apps.astronomy.services.exoplanet_archive import fetch_exoplanets


class Command(BaseCommand):
    # help
    # — `python manage.py help fetch_exoplanets` 명령어를 실행했을 때 보여주는 설명문.
    #
    # nasa_neo.py 
    # — fetch_feed()는 shell에서 직접 호출하는 '함수'이다.
    #
    # fetch_exoplanets.py 
    # — 터미널에서 바로 호출하는 명령어로 승격시키는 과정이라 사용법 안내가 필요하다.
    help = "NASA Exoplanet Archive에서 외계행성 데이터를 가져와 DB에 저장한다."

    def handle(self, *args, **options):
        # Django가 `python manage.py fetch_exoplanets`를 실행하면
        # fetch_exoplanets.py 안에서 딱 하나, handle() 메서드를 찾아 실행한다.
        # 비유: 편의점 계산대 — 손님이 살 물품을 계산하러 오면 점원은 정해진 순서에 따라 계산을 진행한다.
        # Django도 마찬가지로 "커맨드 실행" 요청이 오면 handle()이라는 정해진 자리를 찿아 실행한다.
         
        # self.stdout.write()를 사용하는 이유
        # print() 처럼 결과가 화면에 출력되는 함수라는 건 동일하지만, Django 커맨드의 관례이다.
        # 이유: 나중에 이 명령어가 자동화 스크립트(cron 등)에 물려서 돌아갈 경우,
        # print()는 출력 stream을 Django가 통제할 수 없지만  
        # self.stdout은 Django가 리다이렉트·테스트 등에서 통제할 수 있는 통로이기 때문이다.
        self.stdout.write("외계행성 데이터 수집을 시작합니다...")

        fetch_exoplanets() # 이미 만들어둔 서비스 함수를 그대로 호출

        # self.style.SUCCESS()는 결과 텍스트를 터미널에 초록색으로 표시해주는 장식.
        # 기능적으로 필요한 건 아니지만, 테스트 "성공"을 눈에 확 띄게 보여주는 용도이다. 
        self.stdout.write(self.style.SUCCESS("외계행성 데이터 수집이 완료되었습니다."))
