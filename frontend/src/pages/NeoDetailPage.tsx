import { useParams } from "react-router";

function NeoDetailPage() {
  // useParams = 택배 송장에서 주소를 읽어오는 것.
  // route를 "/neo/:id"로 등록해두었다면 실제 주소 "/neo/2357621"에서 
  // :id 자리에 들어있던 값(2357621)을 꺼내준다.
  // 이 id가 추후 GET /api/neo/{nasa_id}/ 호출에 그대로 들어간다.
  const { id } = useParams();
  
  return (
    <div>
      <h1>NEO 상세 (/neo/:id)</h1>
      <p>받은 id: {id}</p>  
    </div>
  );
}

export default NeoDetailPage;
