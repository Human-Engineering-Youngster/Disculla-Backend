# アーキテクチャドキュメント

## アーキテクチャパターン

**Clean Architecture** (クリーンアーキテクチャ)

---

## 概要

このプロジェクトはClean Architectureの原則に基づいており、依存関係が外側から内側に向かう層構造を採用しています。ビジネスロジックをフレームワークやデータベースから独立させ、テスタビリティと保守性を高めることを目的としています。

---

## ディレクトリ構造

```txt
src/
├── domain/                          # 共通ドメイン層
│   └── xx.vo.ts                    # 共有される値オブジェクト
│
├── main.ts                          # アプリケーションエントリーポイント
│
└── modules/                         # 機能モジュール群
    ├── xx/                          # 個別機能モジュール(例: user, product等)
    │   ├── application/             # アプリケーション層
    │   │   └── xx.service.ts       # ビジネスロジック・ユースケース実装
    │   │
    │   ├── domain/                  # ドメイン層(最も内側・依存なし)
    │   │   ├── xx.entity.ts        # エンティティ(ビジネスの中核オブジェクト)
    │   │   ├── xx-name.vo.ts       # 値オブジェクト(不変のドメイン値)
    │   │   ├── create-xx.vo.ts     # 作成用値オブジェクト
    │   │   ├── update-xx.vo.ts     # 更新用値オブジェクト
    │   │   └── xx.repository.interface.ts  # リポジトリインターフェース(抽象)
    │   │
    │   ├── infrastructure/          # インフラストラクチャ層(最も外側)
    │   │   └── xx.repository.ts    # リポジトリ実装(DB操作など)
    │   │
    │   └── interface/               # インターフェース層(プレゼンテーション)
    │       ├── dto/                 # データ転送オブジェクト
    │       │   ├── create-xx.dto.ts
    │       │   ├── update-xx.dto.ts
    │       │   └── xx-response.dto.ts
    │       ├── mapper/              # データ変換マッパー
    │       │   └── xx.mapper.ts    # DTO ⇔ VO/Entity変換
    │       └── xx.controller.ts     # コントローラー(HTTP/API入口)
    │
    └── xx.module.ts                 # モジュール定義(DI設定)
```

---

## 各層の責務

### 1. **Domain層** (最も内側 - 依存なし)

- **責務**: ビジネスルールとドメインロジックの定義
- **特徴**: 他の層に依存しない、フレームワーク非依存
- **含まれるもの**:
  - `Entity`: ビジネスの中核概念を表現(ID保持、ライフサイクル管理)
  - `Value Object (VO)`: 不変の値を表現(例: メールアドレス、価格)
  - `Repository Interface`: データ永続化の抽象(実装は持たない)

### 2. **Application層** (ユースケース層)

- **責務**: アプリケーション固有のビジネスロジック実行
- **特徴**: ドメイン層のみに依存
- **含まれるもの**:
  - `Service`: ユースケースの実装(複数エンティティの調整など)

### 3. **Interface層** (プレゼンテーション層)

- **責務**: 外部とのやり取り(HTTPリクエスト/レスポンス)
- **特徴**: Application層に依存
- **含まれるもの**:
  - `Controller`: APIエンドポイント定義
  - `DTO`: 外部とのデータ交換形式
  - `Mapper`: DTO ⇔ VO/Entity間のデータ変換

### 4. **Infrastructure層** (最も外側)

- **責務**: 外部システムとの接続(DB、外部API等)
- **特徴**: Domain層のインターフェースを実装
- **含まれるもの**:
  - `Repository実装`: 実際のデータベース操作
  - `Type定義`: ORM固有の型定義(例: Prismaの型)

---

## 依存関係のルール

```txt
Infrastructure → Application → Domain
     ↑              ↑
Interface ──────────┘
```

- **Domain層**: どこにも依存しない(純粋なビジネスロジック)
- **Application層**: Domain層のみに依存
- **Interface層**: Application層とDomain層に依存
- **Infrastructure層**: Domain層のインターフェースを実装

**重要**: 依存の方向は常に内側(Domain)に向かう

---

## Mapperパターン

### 目的

Mapperは、異なる層間のデータ変換を担当します。主に以下の変換を行います:

- **DTO → VO**: 外部から受け取ったDTOをドメイン層のValue Objectに変換
- **Entity → DTO**: ドメインエンティティをAPIレスポンス用のDTOに変換
- **VO → DTO**: Value ObjectをDTOに変換

### 責務

- データ構造の変換ロジックを一箇所に集約
- 各層の独立性を保つ
- 型安全なデータ変換を提供

### 配置場所

Mapperは`interface/mapper/`ディレクトリに配置され、Interface層に属します。

### 利点

- **単一責任の原則**: データ変換ロジックを専用のクラスに分離
- **テスタビリティ**: 変換ロジックを独立してテスト可能
- **保守性**: 変換ロジックの変更が一箇所で完結
- **再利用性**: 複数のコントローラーやサービスから利用可能

---

## 命名規則

| ファイル種別              | 命名例                         | 説明                   |
| ------------------------- | ------------------------------ | ---------------------- |
| Entity                    | `user.entity.ts`               | ビジネスエンティティ   |
| Value Object              | `user-email.vo.ts`             | 値オブジェクト         |
| Repository Interface      | `user.repository.interface.ts` | 抽象リポジトリ         |
| Repository Implementation | `user.repository.ts`           | リポジトリ実装         |
| Service                   | `user.service.ts`              | ユースケース実装       |
| Controller                | `users.controller.ts`          | APIコントローラー      |
| DTO                       | `create-user.dto.ts`           | データ転送オブジェクト |
| Mapper                    | `user.mapper.ts`               | データ変換マッパー     |
| Module                    | `user.module.ts`               | モジュール定義         |

---

## 具体例: Userモジュール

```txt
modules/user/
├── domain/
│   ├── user.entity.ts                    # Userエンティティ
│   ├── user-id.vo.ts                     # ユーザーID値オブジェクト
│   ├── user-name.vo.ts                   # ユーザー名値オブジェクト
│   ├── user-email.vo.ts                  # メールアドレス値オブジェクト
│   ├── create-user.vo.ts                 # ユーザー作成用VO
│   ├── update-user.vo.ts                 # ユーザー更新用VO
│   └── user.repository.interface.ts      # Userリポジトリインターフェース
├── application/
│   └── user.service.ts                   # ユーザー管理サービス
├── infrastructure/
│   ├── user.repository.ts                # Userリポジトリ実装(Prisma)
│   └── prisma-user.type.ts               # Prisma User型定義
├── interface/
│   ├── dto/
│   │   ├── create-user.dto.ts            # ユーザー作成リクエストDTO
│   │   ├── update-user.dto.ts            # ユーザー更新リクエストDTO
│   │   └── user-response.dto.ts          # ユーザーレスポンスDTO
│   ├── mapper/
│   │   └── user.mapper.ts                # User Mapper (DTO ⇔ VO変換)
│   ├── users.controller.ts               # Users コントローラー(RESTful API)
│   └── users.controller.spec.ts          # コントローラーのテスト
└── user.module.ts                        # Userモジュール定義
```
