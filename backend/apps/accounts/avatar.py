"""
프로필 사진 다듬기 ─ 올라온 파일을 "믿지 않고" 이미지로 열어 본 뒤, 256×256 WebP로 새로 만든다. (10-28)

비유: 공항 보안 검색 ─ 가방(파일) 겉에 붙은 이름표(확장자·Content-Type)를 믿지 않고 X선(Pillow)으로 열어 본다.
그리고 내용물을 새 가방에 옮겨 담아(다시 인코딩) 보낸다 → 원래 가방에 숨겨진 것(위치 정보 EXIF, 이상한 데이터)은 따라오지 않는다.
"""

from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 2 * 1024 * 1024  # 2MB
MAX_PIXELS = 40_000_000  # 압축 폭탄 방지 ─ 2MB짜리 PNG가 풀면 수 GB가 될 수 있다. 열기 전에 크기부터 본다
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
SIZE = 256


class AvatarError(ValueError):
    """사용자에게 그대로 보여줄 수 있는 문구를 담은 오류"""


def process_avatar(uploaded) -> bytes:
    if uploaded.size > MAX_UPLOAD_BYTES:
        raise AvatarError("사진은 2MB 이하만 올릴 수 있어요.")
    try:
        img = Image.open(uploaded)  # 여기선 머리(헤더)만 읽는다 ─ 픽셀은 아직 안 푼다
        if img.format not in ALLOWED_FORMATS:
            raise AvatarError("JPG·PNG·WebP·GIF 사진만 올릴 수 있어요.")
        if img.width * img.height > MAX_PIXELS:
            raise AvatarError("사진 해상도가 너무 커요.")
        img.seek(0)  # 움직이는 GIF는 첫 장만
        img = ImageOps.exif_transpose(img)  # 폰 사진의 "세워서 찍음" 정보대로 돌려 놓기 (돌린 뒤 EXIF는 버린다)
        img = ImageOps.fit(img.convert("RGBA"), (SIZE, SIZE), Image.Resampling.LANCZOS)  # 가운데 기준 정사각형으로 자르고 줄이기
    except AvatarError:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise AvatarError("이미지 파일이 아니거나 열 수 없는 파일이에요.")

    out = BytesIO()
    img.save(out, format="WEBP", quality=85)  # 새로 저장 = 메타데이터(위치·기기 정보) 없음
    return out.getvalue()
