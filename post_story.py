#!/usr/bin/env python3
"""
LIT（長崎の学生向けバー）Instagram ストーリー自動投稿スクリプト

使い方:
  python post_story.py              # 当日分を投稿
  python post_story.py 2025-06-07   # 日付指定投稿
"""

import csv
import logging
import os
import random
import shutil
import sys
from datetime import datetime
from pathlib import Path

import anthropic
import requests

# ===== パス定数 =====
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = BASE_DIR / "story_images"
NORMAL_DIR = IMAGES_DIR / "normal"
SPECIAL_DIR = IMAGES_DIR / "special"
SEASONAL_DIR = IMAGES_DIR / "seasonal"
USED_DIR = IMAGES_DIR / "used"
LOG_FILE = BASE_DIR / "logs" / "post_log.txt"

CALENDAR_CSV = DATA_DIR / "calendar.csv"
SHIFT_CSV = DATA_DIR / "shift.csv"

# ===== 設定 =====
# False: ログ出力のみ（シミュレート）/ True: 実際にInstagramへ投稿
IG_LIVE_MODE = os.environ.get("IG_LIVE_MODE", "false").lower() == "true"
IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "")
IG_USER_ID = os.environ.get("IG_USER_ID", "")

CLAUDE_MODEL = "claude-sonnet-4-20250514"

# Firebase Admin SDK 用環境変数（未設定の場合はFirestore連携をスキップ）
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
FIREBASE_PRIVATE_KEY = os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
FIREBASE_CLIENT_EMAIL = os.environ.get("FIREBASE_CLIENT_EMAIL", "")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# ===== ログ設定 =====

def setup_logger() -> logging.Logger:
    """ファイルとコンソールの両方にログ出力するロガーを設定する"""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("lit_ig")
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # ファイルハンドラ（追記モード）
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8", mode="a")
    fh.setFormatter(formatter)

    # コンソールハンドラ
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)

    logger.addHandler(fh)
    logger.addHandler(ch)

    return logger


logger = setup_logger()


# ===== Firestore連携 =====

def _get_firestore_client():
    """Firebase Admin SDK の Firestore クライアントを遅延初期化して返す。
    環境変数が未設定の場合や初期化失敗時は None を返す。"""
    if not all([FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL]):
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore as fs_module

        try:
            firebase_admin.get_app()
        except ValueError:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": FIREBASE_PROJECT_ID,
                "private_key": FIREBASE_PRIVATE_KEY,
                "client_email": FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            firebase_admin.initialize_app(cred)

        return fs_module.client()

    except ImportError:
        logger.warning("firebase-admin がインストールされていません。Firestore連携をスキップします。")
        return None


def get_firestore_override(date_str: str) -> dict | None:
    """Firestore の daily_overrides/{date} からオーバーライドデータを取得する。
    ドキュメントが存在すれば dict を、なければ None を返す。"""
    try:
        client = _get_firestore_client()
        if client is None:
            return None

        doc = client.collection("daily_overrides").document(date_str).get()
        if doc.exists:
            logger.info(f"Firestoreオーバーライドを取得しました: {date_str}")
            return doc.to_dict()

        logger.info(f"Firestoreにオーバーライドデータなし: {date_str}")
        return None

    except Exception as e:
        logger.warning(f"Firestore取得エラー（スキップして続行）: {e}")
        return None


# ===== Step1: カレンダー取得 =====

def get_calendar_entry(date_str: str) -> dict | None:
    """calendar.csv から指定日のエントリを取得する"""
    with open(CALENDAR_CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["date"].strip() == date_str:
                return {k: v.strip() for k, v in row.items()}
    return None


# ===== Step2: シフト取得 =====

def get_staff(date_str: str) -> str:
    """shift.csv から指定日のスタッフ名を取得する"""
    with open(SHIFT_CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["date"].strip() == date_str:
                return row["staff"].strip()
    return ""


# ===== Step3: 画像選択 =====

def get_images_in_dir(directory: Path) -> list[Path]:
    """ディレクトリ内の画像ファイル一覧を返す"""
    return [
        p for p in directory.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]


def refill_normal_from_used() -> None:
    """normal/ が空になったとき used/ から normal/ に全ファイルを補充する"""
    used_images = get_images_in_dir(USED_DIR)
    if not used_images:
        logger.warning("used/ にも画像がありません。story_images/normal/ に画像を追加してください。")
        return

    for img in used_images:
        shutil.move(str(img), str(NORMAL_DIR / img.name))

    logger.info(f"used/ から normal/ に {len(used_images)} 枚の画像を補充しました。")


def select_image(entry: dict) -> Path | None:
    """エントリの種別に応じて投稿画像を選択する"""
    entry_type = entry.get("type", "normal")
    image_path_str = entry.get("image_path", "")

    # special で image_path 指定あり → 指定パスをそのまま使用（used/ に移動しない）
    if entry_type == "special" and image_path_str:
        img_path = Path(image_path_str)
        if not img_path.is_absolute():
            img_path = BASE_DIR / img_path
        if img_path.exists():
            logger.info(f"特別日: 指定画像を使用します: {img_path}")
            return img_path
        logger.warning(f"指定された画像が見つかりません: {img_path}")
        return None

    # normal/ からランダム選択
    normal_images = get_images_in_dir(NORMAL_DIR)
    if not normal_images:
        logger.info("normal/ が空のため used/ から自動補充します。")
        refill_normal_from_used()
        normal_images = get_images_in_dir(NORMAL_DIR)

    if not normal_images:
        logger.error("使用できる画像がありません。")
        return None

    selected = random.choice(normal_images)

    # 通常日のみ used/ に移動する（特別日は移動しない）
    if entry_type == "normal":
        dest = USED_DIR / selected.name
        shutil.move(str(selected), str(dest))
        logger.info(f"画像を used/ に移動しました: {selected.name}")
        return dest

    # special で image_path 未指定の場合は normal/ から選ぶが移動しない
    logger.info(f"特別日（画像指定なし）: normal/ から選択、移動はスキップ: {selected.name}")
    return selected


# ===== Step4: キャプション生成 =====

def generate_caption_with_claude(staff: str, open_time: str, note: str) -> str:
    """Claude API を使ってInstagramストーリー用キャプションを生成する"""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    note_line = f"- 備考（必ず反映): {note}" if note else ""

    prompt = f"""長崎の学生向けバー「LIT」のInstagramストーリー用キャプションを日本語で生成してください。

条件：
- 20〜40文字以内
- スタッフ名「{staff}」とオープン時間「{open_time}」を自然に含める
- フレンドリーでおしゃれなトーン
- 絵文字1〜2個のみ使用
- ハッシュタグなし
{note_line}

キャプションのテキストのみ出力してください（前置きや説明文は不要）。"""

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


def get_caption(entry: dict, staff: str, override: dict | None = None) -> str:
    """キャプションを取得する。優先順位: Firestore > CSV custom_text > Claude API
    override は呼び出し元で取得済みの Firestore データを渡す（二重取得を避けるため）。"""
    # Firestoreの open_time があれば優先使用
    fs_open_time = (override.get("open_time") or "").strip() if override else ""
    open_time = fs_open_time or entry.get("open_time", "")
    note = entry.get("note", "")

    if override:
        fs_text = (override.get("custom_text") or "").strip()
        fs_mentions = override.get("mentions") or []

        if fs_text:
            logger.info("Firestoreのcustom_textをキャプションとして使用します。")
            caption = fs_text
        else:
            logger.info("FirestoreにテキストなしのためClaude APIでキャプションを生成します。")
            caption = generate_caption_with_claude(staff, open_time, note)

        if fs_mentions:
            caption = caption + " " + " ".join(fs_mentions)
            logger.info(f"メンションを追記しました: {fs_mentions}")

        return caption

    # Firestoreオーバーライドなし → 従来ロジック
    entry_type = entry.get("type", "normal")
    csv_custom_text = entry.get("custom_text", "")

    if entry_type == "special" and csv_custom_text:
        logger.info("CSVのcustom_textをそのままキャプションとして使用します（Claude API 呼び出しなし）。")
        return csv_custom_text

    logger.info("Claude API でキャプションを生成します。")
    return generate_caption_with_claude(staff, open_time, note)


# ===== Step5: Instagram投稿 =====

def upload_image_to_storage(image_path: Path) -> str:
    """ローカル画像をストレージにアップロードして公開URLを返す（フォールバック用）。
    管理画面経由で Firebase Storage に登録済みの場合は resolve_image_url() が先に使う。
    TODO: S3 / GCS / Cloudinary などのアップロード処理を実装する。"""
    raise NotImplementedError(
        "ローカルからのアップロードは未実装です。"
        "管理画面から画像をアップロードして Firebase Storage の URL を登録してください。"
    )


def resolve_image_url(image_path: Path | None, override: dict | None) -> str:
    """投稿画像の公開URLを解決する。
    Firestore に image_url があればそれを優先し、なければローカルファイルをアップロードする。"""
    if override and override.get("image_url"):
        url = override["image_url"]
        logger.info(f"Firebase StorageのURLを使用: {url}")
        return url

    if image_path is None:
        raise ValueError("image_url も image_path も指定されていません。")

    logger.info("Firestoreにimage_urlなし。ローカルファイルをアップロードします。")
    return upload_image_to_storage(image_path)


def post_to_instagram(image_url: str, caption: str) -> bool:
    """Instagram Graph API v19.0 を使ってストーリーを投稿する"""

    # シミュレートモード（IG_LIVE_MODE = False）
    if not IG_LIVE_MODE:
        logger.info("[シミュレート] IG_LIVE_MODE=False のため実際の投稿はスキップします。")
        logger.info(f"[シミュレート] 投稿予定画像URL: {image_url}")
        logger.info(f"[シミュレート] 投稿予定キャプション: {caption}")
        return True

    base_url = f"https://graph.facebook.com/v19.0/{IG_USER_ID}"

    # Step1: メディアコンテナを作成（image_url は Firebase Storage の公開URL）
    logger.info("Step1: Instagram メディアコンテナを作成します。")
    media_resp = requests.post(
        f"{base_url}/media",
        data={
            "image_url": image_url,
            "media_type": "STORIES",
            "access_token": IG_ACCESS_TOKEN,
        },
        timeout=30,
    )

    if media_resp.status_code != 200:
        logger.error(f"メディアコンテナ作成失敗 (HTTP {media_resp.status_code}): {media_resp.text}")
        return False

    creation_id = media_resp.json().get("id")
    logger.info(f"メディアコンテナID: {creation_id}")

    # Step2: メディアを公開
    logger.info("Step2: Instagram ストーリーを公開します。")
    publish_resp = requests.post(
        f"{base_url}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": IG_ACCESS_TOKEN,
        },
        timeout=30,
    )

    if publish_resp.status_code != 200:
        logger.error(f"ストーリー公開失敗 (HTTP {publish_resp.status_code}): {publish_resp.text}")
        return False

    published_id = publish_resp.json().get("id")
    logger.info(f"投稿成功 (media ID: {published_id})")
    return True


# ===== メイン処理 =====

def main() -> None:
    # コマンドライン引数で日付指定可能（未指定時は当日）
    if len(sys.argv) > 1:
        date_str = sys.argv[1]
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            logger.error(f"日付形式が不正です: {date_str}（正しい形式: YYYY-MM-DD）")
            sys.exit(1)
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")

    logger.info(f"===== LIT Instagram ストーリー自動投稿 開始: {date_str} =====")

    # Step1: カレンダー取得
    logger.info("【Step1】カレンダー情報を取得します。")
    entry = get_calendar_entry(date_str)

    if entry is None:
        logger.info(f"{date_str} のカレンダー情報がありません。処理を終了します。")
        return

    entry_type = entry.get("type", "")
    if entry_type == "closed":
        logger.info(f"{date_str} は定休日（closed）です。投稿をスキップします。")
        return

    logger.info(f"カレンダー情報: type={entry_type}, open={entry.get('open_time')}, note={entry.get('note')}")

    # Step2: シフト取得
    logger.info("【Step2】シフト情報を取得します。")
    staff = get_staff(date_str)
    if staff:
        logger.info(f"担当スタッフ: {staff}")
    else:
        logger.warning(f"{date_str} のシフト情報が見つかりません。スタッフ名なしで続行します。")

    # Firestore オーバーライドを一度だけ取得（Step4・Step5 で共用）
    override = get_firestore_override(date_str)

    # Step3: 画像URL解決
    logger.info("【Step3】投稿画像のURLを解決します。")
    image_path = select_image(entry)  # ローカル画像（Firestoreにない場合のフォールバック）
    try:
        resolved_image_url = resolve_image_url(image_path, override)
        logger.info(f"投稿画像URL: {resolved_image_url}")
    except (NotImplementedError, ValueError) as e:
        logger.error(f"画像URLの解決に失敗しました: {e}")
        sys.exit(1)

    # Step4: キャプション生成
    logger.info("【Step4】キャプションを取得します。")
    try:
        caption = get_caption(entry, staff, override)
        logger.info(f"キャプション: {caption}")
    except Exception as e:
        logger.error(f"キャプション生成に失敗しました: {e}")
        sys.exit(1)

    # Step5: Instagram投稿
    logger.info("【Step5】Instagram ストーリーを投稿します。")
    success = post_to_instagram(resolved_image_url, caption)

    if success:
        logger.info(f"===== 投稿完了: {date_str} =====")
    else:
        logger.error(f"===== 投稿失敗: {date_str} =====")
        sys.exit(1)


if __name__ == "__main__":
    main()
