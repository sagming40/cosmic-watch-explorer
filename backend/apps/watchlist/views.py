"""
Watchlist API. 문서 04 ─ 7장

apps/watchlist/views가 apps/astronomy/view와 다른 점 ─ 전부 permission_classes가 걸려 있다.
astronomy ─ 누구나 볼 수 있어야 함. (NEO·Exoplanet 조회)
watchlist ─ "내가 저장한 목록". 로그인한 자기 자신 것만 봐야 한다.
"""

from django.db import IntegrityError

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.exception_handler import AlreadyExists, ResourceNotFound
from config.permissions import IsAuthenticatedOr401

from apps.astronomy.models import Neo, Exoplanet

from .models import NeoWatchlist, ExoplanetWatchlist
from .serializers import (
    NeoWatchlistRowSerializer, NeoWatchlistCreateSerializer,
    ExoplanetWatchlistRowSerializer, ExoplanetWatchlistCreateSerializer,
)

class NeoWatchlistView(APIView):
    """
    GET·POST /api/watchlist/neo/ ─ 문서 04, 7.2/7.3절

    ListAPIView가 아닌 APIView인 이유 ─ settings.py의 DEFAULT_PAGINATION_CLASS가 전역으로 걸려있어서,
    ListAPIView를 사용하게 될 경우 CommonPagination이 자동으로 붙어 명세에는 없는 page/total_pages가
    응답에 딸려 나간다. Exoplanet 목록의 "페이징이 필요하다"는 표시로 pagination_class를 명시했다면,
    NeoWatchlistView는 반대로 APIView를 고르는 것 자체가 "이 목록은 페이징하지 않는다"는 표시이다.
    """
    permission_classes = [IsAuthenticatedOr401]

    def get(self, request):
        queryset = (
            NeoWatchlist.objects
            .filter(user=request.user)
            .select_related("neo")
            .order_by("-created_at")
        )
        # list() 한번에 당겨온다 ─ NeoDashboardView의 "설계 결정 ①"과 같은 원칙
        # queryset.count()를 따로 부르면 COUNT 쿼리가 한 번 더 나간다.
        items = list(queryset)
        
        return Response({
            "count": len(items),
            "results": NeoWatchlistRowSerializer(items, many=True).data,
        })
        # ⚠️ known issue: get_next_approach가 항목마다 별도 쿼리를 낸다 (N+1)
        # Exoplanet 목록의 N+1은 20건 × 페이지 수백 개라 반드시 잡아야 했지만,
        # 관심 천체는 많아봤자 수십 건 규모라 응답값이 달라지지 않는다. (N+1 허용)
        # ─ 정확성 문제가 아닌 순수 속도 문제. 개발 일지 기록 필요.
    
    def post(self, request):
        serializer = NeoWatchlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nasa_id = serializer.validated_data["nasa_id"]
        
        # ① 대상이 실제로 존재하는지 먼저 확인 ─ NeoDetailView와 같은 패턴
        #   확인 없이 바로 저장을 시도할 경우 존재하지 않는 nasa_id도 FK 제약 위반으로
        #   500(IntegrityError)가 터져 사용자에게 원인 불명의 오류로 보인다.
        neo = Neo.objects.filter(nasa_id=nasa_id).first()
        if neo is None:
            raise ResourceNotFound("해당 소행성을 찾을 수 없습니다.")
        
        # ② 저장 시도 ─ "있는지 확인 후 저장"이 아니라 "저장을 먼저 시도해본 후 실패할 시 409".
        #   UNIQUE(user, neo) 제약(문서 02 ─ 3.6절)이 최종 방어선
        #   동시에 같은 요청이 중복으로 들어와도 여기서 하나는 반드시 막힌다.
        try:
            watchlist_item = NeoWatchlist.objects.create(user=request.user, neo=neo)
        except IntegrityError:
            raise AlreadyExists()
        
        return Response(
            {"nasa_id": nasa_id, "saved_at": watchlist_item.created_at},
            status=status.HTTP_201_CREATED,
        )


class NeoWatchlistDeleteView(APIView):
    """
    DELETE /api/watchlist/neo/{nasa_id}/ ─ 문서 04, 7.4절
    """
    permission_classes = [IsAuthenticatedOr401]
    
    def delete(self, request, nasa_id):
        # ⭐ user=request.user 필터 
        # ─ 필터가 없으면 nasa_id만 맞아도 다른 사람의 Watchlist 항목도 삭제할 수 있다.
        # "교차 로그인 시 열람 불가" ─ 보이지 않을 뿐만 아니라 건드리지도 못해야 진짜 격리라고 할 수 있다.
        NeoWatchlist.objects.filter(user=request.user, neo__nasa_id=nasa_id).delete()
        
        # 저장되어 있지 않았어도 응답 코드 200 throw
        # 문서 04, 7.4절: "결과적으로 저장되어 있지 않다"는 목적은 달성했기 때문.
        # exists() 확인 없이 delete()만 부르는 이유도 이 때문이다.
        # 몇 건이 지워지든 응답은 똑같아야 하므로 분기를 나눌 필요가 없다.
        return Response({"nasa_id": nasa_id, "deleted": True})
    
    
class ExoplanetWatchlistView(APIView):
    """
    GET·POST /api/watchlist/exoplanets/ ─ 문서 04, 7.5절
    NeoWatchlistView와 완전한 대칭 구조.
    """
    permission_classes = [IsAuthenticatedOr401]
    
    def get(self, request):
        queryset = (
            ExoplanetWatchlist.objects
            .filter(user=request.user)
            .select_related("exoplanet", "exoplanet__host_star")
            # ↑ NEO와 달리 N+1이 아예 없다 ─ host_star의 name/distance_pc가
            # select_related로 이미 한 번에 딸려오기 때문에, HostStarMiniSerializer가
            # 추가 query를 날릴 일이 없다.
            # ExoplanetDetailView가 host_star를 미리 당겨왔던 것과 같은 이유
            .order_by("-created_at")
        )    
        items = list(queryset)
        
        return Response({
            "count": len(items),
            "results": ExoplanetWatchlistRowSerializer(items, many=True).data,
        })
    
    def post(self, request):
        serializer = ExoplanetWatchlistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exoplanet_id = serializer.validated_data["exoplanet_id"]
        
        exoplanet = Exoplanet.objects.filter(pk=exoplanet_id).first()
        if exoplanet is None:
            raise ResourceNotFound("해당 외계행성을 찾을 수 없습니다.")
        
        try:
            watchlist_item = ExoplanetWatchlist.objects.create(
                user=request.user, exoplanet=exoplanet
            )    
        except IntegrityError:
            raise AlreadyExists()
        
        return Response(
            {"exoplanet_id": exoplanet_id, "saved_at": watchlist_item.created_at},
            status=status.HTTP_201_CREATED,
        )    
        
        
class ExoplanetWatchlistDeleteView(APIView):
    """
    DELETE /api/watchlist/exoplanets/{exoplanet_id}/ ─ 문서 04, 7.5절
    """        
    permission_classes = [IsAuthenticatedOr401]
    
    def delete(self, request, exoplanet_id):
        ExoplanetWatchlist.objects.filter(
            user=request.user, exoplanet_id=exoplanet_id
        ).delete()
        return Response({"exoplanet_id": exoplanet_id, "deleted": True})
