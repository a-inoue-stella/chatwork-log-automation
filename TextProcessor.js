/**
 * TextProcessor 名前空間: Chatworkメッセージの高度なクレンジング、構造化、実名解決を担う
 */
const TextProcessor = (() => {

  /**
   * システムタグを翻訳し、ノイズを除去した上で実名を紐付け、AI解析に最適化されたテキストを返す
   * @param {string} body - Chatworkから取得した生のメッセージ本文
   * @param {Object} nameMap - { account_id: name } の形式のアカウントIDと名前の対応表
   * @returns {string} 可読性を最大化した整形済みテキスト
   */
  function processMessage(body, nameMap = {}) {
    if (!body) return "";

    let processedBody = body;

    // 1. 引用メタデータの完全削除 [qtmeta ...] 
    // AIが数値やタイムスタンプIDを誤認するのを防ぐ
    processedBody = processedBody.replace(/\[qtmeta[^\]]*\]/g, '');

    // 2. TO通知の構造化：[To:xxxx] 氏名さん -> 【TO: 】氏名さん
    // Chatworkデフォルトの「さん」を活かし、追加の敬称は付与しない
    processedBody = processedBody.replace(/\[To:\d+\]\s*/g, '【TO: 】');

    // 3. システムメッセージ(dtext)の日本語翻訳
    // AIが組織内のイベント（作成・招待・編集）を文脈として正しく把握できるように言語化する
    const dtextMap = {
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

    Object.keys(dtextMap).forEach(key => {
      const reg = new RegExp(`\\[dtext:${key}\\]`, 'g');
      processedBody = processedBody.replace(reg, dtextMap[key]);
    });

    // 4. [piconname:xxxx] の実名解決
    // IDを名前に置換することで、AIが人物間の関係性を正しく把握できるようにする
    processedBody = processedBody.replace(/\[piconname:(\d+)\]/g, (match, id) => {
      return nameMap[id] ? nameMap[id] : `(ユーザーID:${id})`;
    });

    // 5. [info]タグ：前後に改行を入れて独立したブロックにする
    processedBody = processedBody.replace(/\[info\]([\s\S]*?)\[\/info\]/g, '\n$1\n');

    // 6. [title]タグ：見出しとして強調し、直後に改行を挿入
    processedBody = processedBody.replace(/\[title\]([\s\S]*?)\[\/title\]/g, '【 $1 】\n');

    // 7. [qt] 引用タグの整形
    // 各行の先頭に引用符を付与し、ドキュメント上の引用ブロックとして識別可能にする
    processedBody = processedBody.replace(/\[qt\]([\s\S]*?)\[\/qt\]/g, (match, p1) => {
      return '\n' + p1.split('\n').map(line => `> (引用): ${line}`).join('\n') + '\n';
    });

    // 8. [download:xxxx] ファイルリンクの整形
    // AIが共有された資料名を重要なマイルストーンとして認識できるようにする
    processedBody = processedBody.replace(/\[download:\d+\](.*?)\[\/download\]/g, '（ファイル添付：$1）');

    // 9. [hr] 横線の置換
    // 視覚的な区切りとして機能させるため、前後に改行を挿入
    processedBody = processedBody.replace(/\[hr\]/g, '\n----------------------------------------\n');

    // 10. その他の残存ノイズタグ（picon, preview, deleted等）の削除
    processedBody = processedBody.replace(/\[picon:\d+\]|\[preview id=\d+\]|\[rp aid=\d+ to=\d+-\d+\]|\[deleted\]/g, '');

    // 11. 仕上げ：過剰な空行（3行以上）を2行（1行空き）に正規化し、前後の空白を削除
    // ドキュメントのレイアウトを美しく整え、AIのトークン効率を高める [cite: 5873, 5958]
    return processedBody.replace(/\n{3,}/g, '\n\n').trim();
  }

  return {
    process: processMessage
  };

})();