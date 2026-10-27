import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // shadcn/ui가 생성한 파일 ─ 직접 쓴 코드가 아니라 CLI가 찍어낸 원본이라, 원본 형태를 유지하기 위해 두 규칙만 완화한다.
    // - Button 옆에 buttonVariants(스타일 함수)를 같이 export하는 게 shadcn 관례
    // - 모든 파일 맨 위에 `import * as React`가 붙어 나온다
    files: ['src/components/ui/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
    },
  },
])
