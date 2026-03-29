# The Feed Masonry

Ghost CMS 기반 반응형 Masonry 피드 정적 사이트.

## 로컬 실행

```bash
python3 -m http.server 8080
```

`http://localhost:8080` 접속.

## 배포

GitHub 저장소 `Settings > Pages`에서 배포 방식 선택:

- **Actions**: `/.github/workflows/deploy.yml`로 `main` push 시 자동 배포
- **Branch**: 루트 정적 파일을 publish source로 지정
