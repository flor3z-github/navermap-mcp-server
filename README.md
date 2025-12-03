# Naver Map MCP Server

네이버 지도 API를 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 도구로 제공하는 서버입니다. Claude Desktop, Claude Code, VS Code 등 MCP 클라이언트에서 네이버 지도 기능을 사용할 수 있습니다.

## 주요 기능

- **주소 → 좌표 변환** (Geocoding): 도로명/지번 주소를 경도, 위도 좌표로 변환
- **좌표 → 주소 변환** (Reverse Geocoding): 좌표를 법정동, 행정동, 도로명, 지번 주소로 변환
- **경로 탐색** (Directions): 출발지-목적지 간 거리, 소요시간, 통행료, 택시비, 유류비 계산
- **정적 지도 이미지 생성** (Static Map): 마커, 경로가 포함된 지도 이미지 생성
- **API 사용량 조회** (Usage): 월별 사용량, 비용, 무료 한도 대비 사용률 확인

## 보안 주의사항

> **주의:** 이 서버는 네이버 클라우드 API에 접근하며, 무료 한도 초과 시 요금이 부과될 수 있습니다.

- API 키를 코드나 공개 저장소에 노출하지 마세요
- 환경변수나 설정 파일을 통해 안전하게 관리하세요
- 무료 한도를 초과하면 사용량에 따라 요금이 부과됩니다
- `navermap_get_usage` 도구로 정기적으로 사용량을 확인하세요

## 설치

```bash
npm install -g @flor3z-github/navermap-mcp-server
```

또는 npx로 직접 실행:

```bash
npx -y @flor3z-github/navermap-mcp-server
```

## 환경변수 설정

### 필수 (Maps API)

[Naver Cloud Platform](https://www.ncloud.com/)에서 Application을 생성하고 API 키를 발급받으세요.

```bash
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 선택 (Billing API - 사용량 조회)

사용량 조회 기능을 사용하려면 추가 키가 필요합니다:

```bash
NCLOUD_ACCESS_KEY=your_access_key
NCLOUD_SECRET_KEY=your_secret_key
```

> Billing API 키가 없어도 나머지 4개 도구는 정상 작동합니다.

## 클라이언트 설정

### Claude Desktop

`claude_desktop_config.json` 파일에 다음을 추가하세요:

**전체 기능 사용:**
```json
{
  "mcpServers": {
    "navermap": {
      "command": "npx",
      "args": ["-y", "@flor3z-github/navermap-mcp-server"],
      "env": {
        "NAVER_CLIENT_ID": "your_client_id",
        "NAVER_CLIENT_SECRET": "your_client_secret",
        "NCLOUD_ACCESS_KEY": "your_access_key",
        "NCLOUD_SECRET_KEY": "your_secret_key"
      }
    }
  }
}
```

**Maps API만 사용:**
```json
{
  "mcpServers": {
    "navermap": {
      "command": "npx",
      "args": ["-y", "@flor3z-github/navermap-mcp-server"],
      "env": {
        "NAVER_CLIENT_ID": "your_client_id",
        "NAVER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### VS Code

`.vscode/mcp.json` 또는 사용자 설정의 `mcp.json`에 추가:

```json
{
  "servers": {
    "navermap": {
      "command": "npx",
      "args": ["-y", "@flor3z-github/navermap-mcp-server"],
      "env": {
        "NAVER_CLIENT_ID": "your_client_id",
        "NAVER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add navermap \
  --env NAVER_CLIENT_ID=your_client_id \
  --env NAVER_CLIENT_SECRET=your_client_secret \
  --env NCLOUD_ACCESS_KEY=your_access_key \
  --env NCLOUD_SECRET_KEY=your_secret_key \
  -- npx -y @flor3z-github/navermap-mcp-server
```

Maps API만 사용 시:

```bash
claude mcp add navermap \
  --env NAVER_CLIENT_ID=your_client_id \
  --env NAVER_CLIENT_SECRET=your_client_secret \
  -- npx -y @flor3z-github/navermap-mcp-server
```

## 제공 도구

모든 도구는 읽기 전용(`readOnlyHint: true`)으로 설정되어 있어 데이터를 변경하지 않습니다.

### 1. navermap_geocode

주소를 좌표로 변환합니다.

**파라미터:**
| 이름 | 필수 | 설명 |
|------|------|------|
| query | O | 검색할 주소 |
| coordinate | X | 검색 중심 좌표 (경도,위도) |
| filter | X | 결과 필터 (예: HCODE:1168000000) |
| language | X | 응답 언어 (ko, en, ja, zh) |
| page | X | 페이지 번호 |
| count | X | 결과 수 (최대 100) |

**사용 예시:**
```
"서울특별시 강남구 테헤란로 152" 주소의 좌표를 알려줘
```

### 2. navermap_reverse_geocode

좌표를 주소로 변환합니다.

**파라미터:**
| 이름 | 필수 | 설명 |
|------|------|------|
| coords | O | 좌표 (경도,위도 형식) |
| sourcecrs | X | 입력 좌표계 |
| targetcrs | X | 출력 좌표계 |
| orders | X | 응답 순서 (legalcode,admcode,addr,roadaddr) |
| output | X | 응답 형식 (json, xml) |

**사용 예시:**
```
127.0368,37.5085 좌표의 주소를 알려줘
```

### 3. navermap_get_directions

경로를 탐색하고 거리, 소요시간, 비용 정보를 제공합니다.

**파라미터:**
| 이름 | 필수 | 설명 |
|------|------|------|
| start | O | 출발지 좌표 (경도,위도) |
| goal | O | 목적지 좌표 (경도,위도) |
| waypoints | X | 경유지 (최대 5개, \|로 구분) |
| option | X | 경로 옵션 (trafast, tracomfort, traoptimal, traavoidtoll, traavoidcaronly) |
| cartype | X | 차량 종류 (1~6) |
| fueltype | X | 연료 종류 |
| mileage | X | 연비 (km/L) |

**경로 옵션:**
- `trafast`: 실시간 빠른길
- `tracomfort`: 편한길
- `traoptimal`: 최적 (기본값)
- `traavoidtoll`: 무료 우선
- `traavoidcaronly`: 자동차 전용도로 회피

**사용 예시:**
```
강남역에서 여의도까지 경로 알려줘
```

### 4. navermap_get_static_map

정적 지도 이미지를 생성합니다.

**파라미터:**
| 이름 | 필수 | 설명 |
|------|------|------|
| center | O | 중심 좌표 (경도,위도) |
| level | X | 줌 레벨 (1~20, 기본값: 16) |
| w | X | 이미지 너비 (최대 1024) |
| h | X | 이미지 높이 (최대 1024) |
| maptype | X | 지도 유형 (basic, traffic, satellite, satellite_base, terrain) |
| markers | X | 마커 설정 |
| path | X | 경로 설정 |
| scale | X | 이미지 스케일 (1 또는 2) |

**사용 예시:**
```
서울역 주변 지도를 보여줘
```

### 5. navermap_get_usage

API 사용량과 비용을 조회합니다. (NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY 필요)

**파라미터:**
| 이름 | 필수 | 설명 |
|------|------|------|
| month | X | 조회할 월 (YYYY-MM, 기본값: 당월) |

**사용 예시:**
```
이번 달 네이버 지도 API 사용량 알려줘
```

**응답 예시:**
```
## 2024-12 Naver Maps API 사용량 현황

### 경고
- Directions 5 사용률이 75.0%입니다. 한도에 주의하세요.

### 서비스별 사용량

| 서비스 | 사용량 | 무료한도 | 사용률 | 비용 |
|--------|--------|----------|--------|------|
| Directions 5 | 45,000 | 60,000 | 75.0% | 0원 |
| Geocoding | 1,500,000 | 3,000,000 | 50.0% | 0원 |
| ... | ... | ... | ... | ... |

### 총 비용: 0원
```

## 무료 이용량 안내

Naver Maps API는 월별 무료 이용량을 제공합니다:

| 서비스 | 무료 한도 (월) |
|--------|----------------|
| Dynamic Map | 6,000,000건 |
| Static Map | 3,000,000건 |
| Geocoding | 3,000,000건 |
| Reverse Geocoding | 3,000,000건 |
| Directions 5 (경유지 5개) | 60,000건 |
| Directions 15 (경유지 15개) | 3,000건 |

> 무료 한도 초과 시 사용량에 따라 요금이 부과됩니다. 자세한 내용은 [Naver Cloud Platform 요금 안내](https://www.ncloud.com/product/applicationService/maps)를 참조하세요.

## 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 개발 모드 (watch)
npm run dev
```

### 디버깅

[MCP Inspector](https://github.com/modelcontextprotocol/inspector)를 사용하여 서버를 디버깅할 수 있습니다:

```bash
npx @modelcontextprotocol/inspector npx -y @flor3z-github/navermap-mcp-server
```

## 라이선스

Apache-2.0
