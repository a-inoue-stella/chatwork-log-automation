/**
 * TextProcessor 名前空間: Chatworkメッセージの高度なクレンジング、構造化、およびセキュリティ保護を担う
 */
const TextProcessor = (() => {

  // システムメッセージ(dtext)の翻訳マップ
  const DTEXT_MAP = {
    'chatroom_groupchat_created': 'グループチャットが作成されました',
    'chatroom_chatname_is': 'チャット名：',
    'chatroom_set': ' に設定されました',
    'chatroom_added': 'が追加されました',
    'chatroom_member_is': 'メンバー：',
    'chatroom_chat_edited': 'チャット設定が変更されました',
    'chatroom_priv_changed': 'の権限が変更されました',
    'chatroom_description_is': '概要：',
    'chatroom_changed': 'に変更されました',
    'file_uploaded': 'ファイルがアップロードされました'
  };

  /**
   * メイン処理: メッセージオブジェクトを受け取り、ログ保存用に整形された文字列を返す
   * @param {Object} msg - Chatwork APIから取得したメッセージオブジェクト
   * @returns {string} ヘッダー付きの整形済みテキスト
   */
  function clean(msg) {
    if (!msg || !msg.body) return "";

    // 1. 本文のクレンジング実行
    let processedBody = processBody(msg.body);

    // 2. セキュリティチェック (パスワード等の自動伏字)
    processedBody = maskSensitiveInfo(processedBody);

    // 3. ヘッダー情報の付与 [日時] 送信者名:
    const date = new Date(msg.send_time * 1000);
    const timeStr = Utilities.formatDate(date, 'Asia/Tokyo', 'MM/dd HH:mm');
    const senderName = msg.account ? msg.account.name : "Unknown";

    // 最終フォーマット結合
    return `[${timeStr}] ${senderName}:\n${processedBody}\n`;
  }

  /**
   * 本文の整形ロジック (旧 processMessage)
   * nameMap依存を排除し、正規表現ベースで完結させる
   */
  function processBody(body) {
    let text = body;

    // 1. 引用メタデータの完全削除
    text = text.replace(/\[qtmeta[^\]]*\]/g, '');

    // 2. TO通知の構造化
    text = text.replace(/\[To:\d+\]\s*/g, ' >> ');

    // 3. システムメッセージ(dtext)の日本語翻訳
    Object.keys(DTEXT_MAP).forEach(key => {
      // 正規表現のエスケープ処理
      const reg = new RegExp(`\\[dtext:${key}\\]`, 'g');
      text = text.replace(reg, DTEXT_MAP[key]);
    });

    // 4. [piconname:xxxx] の処理
    // nameMapがないため、汎用的な表記に置換 (API負荷軽減のため)
    text = text.replace(/\[piconname:(\d+)\]/g, '(User:$1)');

    // 5. [info]タグのブロック化
    text = text.replace(/\[info\]([\s\S]*?)\[\/info\]/g, '\n$1\n');

    // 6. [title]タグの見出し化
    text = text.replace(/\[title\]([\s\S]*?)\[\/title\]/g, '【 $1 】\n');

    // 7. [qt] 引用タグの整形
    text = text.replace(/\[qt\]([\s\S]*?)\[\/qt\]/g, (match, p1) => {
      return '\n' + p1.split('\n').map(line => `> ${line}`).join('\n') + '\n';
    });

    // 8. ファイルリンクの整形
    text = text.replace(/\[download:\d+\](.*?)\[\/download\]/g, '（ファイル添付：$1）');

    // 9. [hr] 横線の置換
    text = text.replace(/\[hr\]/g, '\n---\n');

    // 10. 残存タグの削除
    text = text.replace(/\[picon:\d+\]|\[preview id=\d+\]|\[rp aid=\d+.*?\]|\[deleted\]/g, '');

    // 11. 空行の正規化
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * 機密情報の自動マスキング (Plan B: Safety Filter)
   * 特定のキーワードやパターンが含まれる場合、伏字にする
   */
  function maskSensitiveInfo(text) {
    // マスキング対象のキーワード（小文字で定義）
    const SENSITIVE_KEYWORDS = ['password', 'passwd', 'パスワード', 'api_key', 'secret_key'];
    
    // 行ごとにチェック
    const lines = text.split('\n');
    const maskedLines = lines.map(line => {
      const lowerLine = line.toLowerCase();
      // キーワードが含まれているかチェック
      const hasSensitiveWord = SENSITIVE_KEYWORDS.some(kw => lowerLine.includes(kw));
      
      if (hasSensitiveWord) {
        // キーワードが含まれる場合、行全体を伏字にする（安全側）
        return `[*** SECURITY MASKED ***]`;
      }
      return line;
    });

    return maskedLines.join('\n');
  }

  return {
    clean: clean
  };

})();