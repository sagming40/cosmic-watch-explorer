// ErrorBoundary.tsx ─ 화면 하나를 그리다 코드가 터져도 앱 전체가 하얘지지 않게 (CLAUDE.md 3.3절 "M5 때" 확정 항목)
//
// React는 그리는 도중 예외가 나면 화면 전체를 지운다(빈 흰 화면). 이 울타리가 그 예외를 받아
// "이 칸만" 안내로 바꾼다 ─ 헤더는 살아 있어서 다른 화면으로 갈 수 있다 (03 문서 7.1절 "막다른 길이 아니다").
// 비유: 집 전체 차단기가 아니라 방마다 있는 누전 차단기.
//
// 클래스 컴포넌트인 이유: 예외를 잡는 기능(getDerivedStateFromError)은 아직 함수 컴포넌트로 쓸 수 없다.
// Layout이 key={pathname}으로 감싸서, 다른 주소로 가면 울타리도 새로 시작한다(한 번 터진 상태가 남지 않게).

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";
import { CircleAlert, RotateCw } from "lucide-react";

import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 화면엔 원인을 안 보여준다(사용자에게 쓸모없는 정보). 개발자 도구 콘솔에만 남긴다
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Panel className="mt-10 flex flex-col items-center py-14 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-line text-bone">
          <CircleAlert className="size-5" />
        </span>
        <p role="alert" className="mt-4 font-medium">화면을 그리다 문제가 생겼어요.</p>
        <p className="mt-1 text-sm text-dim">새로고침하면 대부분 해결돼요. 계속되면 다른 화면으로 이동해 보세요.</p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => window.location.reload()}>
            <RotateCw /> 새로고침
          </Button>
          <Button variant="outline" asChild>
            <Link to="/" className="text-bone">대시보드로</Link>
          </Button>
        </div>
      </Panel>
    );
  }
}

export default ErrorBoundary;
