/**
 * TextProcessor 名前空間: Chatworkメッセージの高度なクレンジングと構造化を担う
 */
const TextProcessor = (() => {

  /**
   * システムタグを日本語に翻訳し、ノイズを完全に除去する
   * @param {string} body - Chatworkから取得した生のメッセージ本文
   * @returns {string} AI解析に最適化された整形済みテキスト
   */
  function processMessage(body) {
    if (!body) return "";

    let processedBody = body;

    // 1. 引用メタデータの完全削除 [qtmeta ...] 
    // AIが数値やIDを誤認するのを防ぐ
    processedBody = processedBody.replace(/\[qtmeta[^\]]*\]/g, '');

    // 2. TO通知の構造化：[To:xxxx] 氏名さん -> 【TO: 氏名さん】
    processedBody = processedBody.replace(/\[To:\d+\]\s*/g, '【TO: 】');

    // 3. システムメッセージ(dtext)の日本語翻訳
    // AIが「何が起きたか」を文脈として正しく把握できるようにします
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

    // 4. [piconname:xxxx] を「（ユーザーID:xxxx）」に一時置換
    // ※名前の完全解決は ChatworkClient.gs 側で行うのが理想的ですが、
    //   まずはAIが「人物に関する言及」だと認識できる形式にします
    processedBody = processedBody.replace(/\[piconname:(\d+)\]/g, '(ユーザーID:$1)');

    // 5. [info] [title] タグのブロック整形
    processedBody = processedBody.replace(/\[info\]([\s\S]*?)\[\/info\]/g, '\n$1\n');
    processedBody = processedBody.replace(/\[title\]([\s\S]*?)\[\/title\]/g, '【 $1 】\n');

    // 6. [qt] 引用タグの整形
    processedBody = processedBody.replace(/\[qt\]([\s\S]*?)\[\/qt\]/g, (match, p1) => {
      return '\n' + p1.split('\n').map(line => `> (引用): ${line}`).join('\n') + '\n';
    });

    // 7. [download:xxxx] ファイルリンクの整形
    processedBody = processedBody.replace(/\[download:\d+\](.*?)\[\/download\]/g, '（ファイル添付：$1）');

    // 8. [hr] 横線の置換
    processedBody = processedBody.replace(/\[hr\]/g, '\n----------------------------------------\n');

    // 9. その他の残存ノイズタグ（picon, preview, deleted等）の削除
    processedBody = processedBody.replace(/\[picon:\d+\]|\[preview id=\d+\]|\[rp aid=\d+ to=\d+-\d+\]|\[deleted\]/g, '');

    // 10. 仕上げ：連続改行の正規化
    return processedBody.replace(/\n{3,}/g, '\n\n').trim();
  }

  return {
    process: processMessage
  };

})();