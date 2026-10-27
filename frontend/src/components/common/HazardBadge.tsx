// HazardBadge ─ "잠재적 위험" 배지
// 색 + 아이콘 + 글자 3중 표시 (03 문서 9장 ─ 위험 여부를 색으로만 표시하지 않는다)

import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function HazardBadge({ label = "잠재적 위험" }: { label?: string }) {
  return (
    <Badge variant="outline" className="gap-1 border-hazard/50 text-hazard">
      <TriangleAlert className="size-3" />
      {label}
    </Badge>
  );
}

export default HazardBadge;
